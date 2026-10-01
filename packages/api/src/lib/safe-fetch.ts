import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type FeedSyncErrorCode = "BLOCKED_URL" | "TIMEOUT" | "NETWORK" | "HTTP_ERROR" | "TOO_LARGE" | "INVALID_FEED";

export class FeedSyncError extends Error {
	constructor(
		readonly code: FeedSyncErrorCode,
		message: string,
	) {
		super(message);
		this.name = "FeedSyncError";
	}
}

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

// * SSRF guard

function isPrivateIp(ip: string): boolean {
	if (ip.includes(":")) {
		const l = ip.toLowerCase();
		if (l === "::1" || l === "::") return true;
		if (l.startsWith("::ffff:")) return isPrivateIp(l.slice(7)); // IPv4-mapped
		if (l.startsWith("fc") || l.startsWith("fd")) return true; // unique local
		if (/^fe[89ab]/.test(l)) return true; // link-local
		return false;
	}
	const [a = 0, b = 0] = ip.split(".").map(Number);
	return (
		a === 0 ||
		a === 10 ||
		a === 127 ||
		(a === 100 && b >= 64 && b <= 127) || // CGNAT
		(a === 169 && b === 254) || // link-local + cloud metadata
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 168) ||
		a >= 224 // multicast + reserved
	);
}

async function assertPublicUrl(raw: string): Promise<void> {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		throw new FeedSyncError("BLOCKED_URL", "Invalid URL.");
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new FeedSyncError("BLOCKED_URL", "Only http/https URLs are allowed.");
	}

	const host = url.hostname.replace(/^\[|\]$/g, "");
	const addrs = isIP(host)
		? [{ address: host }]
		: await lookup(host, { all: true }).catch(() => {
				throw new FeedSyncError("NETWORK", "Could not resolve host.");
			});

	if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
		throw new FeedSyncError("BLOCKED_URL", "This URL is not allowed.");
	}
}

// * Fetch

const FEED_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const PAGE_MAX_BYTES = 3 * 1024 * 1024; // 3MB

function mapNetworkError(e: unknown, what: string): FeedSyncError {
	if (e instanceof FeedSyncError) return e;
	if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
		return new FeedSyncError("TIMEOUT", `${what} took too long to respond.`);
	}
	return new FeedSyncError("NETWORK", `Could not reach the ${what.toLowerCase()}.`);
}

async function readLimited(res: Response, maxBytes: number, what: string): Promise<string> {
	const reader = res.body?.getReader();
	if (!reader) return "";
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > maxBytes) {
			await reader.cancel();
			throw new FeedSyncError("TOO_LARGE", `${what} is too large.`);
		}
		chunks.push(value);
	}
	return Buffer.concat(chunks).toString("utf8");
}

type GuardedOptions = {
	headers: Record<string, string>;
	maxBytes: number;
	what: "Feed" | "Page";
	contentType?: RegExp; // nếu có, từ chối response không khớp trước khi đọc body
};

type GuardedResult = { notModified: true } | { notModified: false; body: string; res: Response };

// Lõi chung: chặn IP nội bộ (kiểm tra lại sau mỗi redirect), timeout, giới hạn dung lượng
async function fetchGuarded(rawUrl: string, opts: GuardedOptions): Promise<GuardedResult> {
	const signal = AbortSignal.timeout(TIMEOUT_MS);

	let current = rawUrl;
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		await assertPublicUrl(current);

		try {
			const res = await fetch(current, { redirect: "manual", signal, headers: opts.headers });

			if (res.status === 304) return { notModified: true };

			if (res.status >= 300 && res.status < 400) {
				await res.body?.cancel();
				const location = res.headers.get("location");
				if (!location) throw new FeedSyncError("HTTP_ERROR", "Redirect without location.");
				current = new URL(location, current).toString();
				continue;
			}

			if (!res.ok) {
				await res.body?.cancel();
				throw new FeedSyncError("HTTP_ERROR", `${opts.what} returned HTTP ${res.status}.`);
			}

			if (opts.contentType && !opts.contentType.test(res.headers.get("content-type") ?? "")) {
				await res.body?.cancel();
				throw new FeedSyncError("HTTP_ERROR", `${opts.what} is not an HTML document.`);
			}

			const body = await readLimited(res, opts.maxBytes, opts.what);
			return { notModified: false, body, res };
		} catch (e) {
			throw mapNetworkError(e, opts.what);
		}
	}

	throw new FeedSyncError("HTTP_ERROR", "Too many redirects.");
}

export type SafeFetchResult =
	| { notModified: true }
	| { notModified: false; body: string; etag: string | null; lastModified: string | null };

export async function safeFetchFeed(
	rawUrl: string,
	cond: { etag?: string | null; lastModified?: string | null } = {},
): Promise<SafeFetchResult> {
	const headers: Record<string, string> = {
		"User-Agent": "SanReader/1.0 (+feed sync)",
		Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
	};
	if (cond.etag) headers["If-None-Match"] = cond.etag;
	if (cond.lastModified) headers["If-Modified-Since"] = cond.lastModified;

	const r = await fetchGuarded(rawUrl, { headers, maxBytes: FEED_MAX_BYTES, what: "Feed" });
	if (r.notModified) return { notModified: true };

	return {
		notModified: false,
		body: r.body,
		etag: r.res.headers.get("etag"),
		lastModified: r.res.headers.get("last-modified"),
	};
}

// Tải trang bài viết gốc (HTML) để trích toàn văn
export async function safeFetchPage(rawUrl: string): Promise<string> {
	const r = await fetchGuarded(rawUrl, {
		headers: {
			"User-Agent": "Mozilla/5.0 (compatible; SanReader/1.0)",
			Accept: "text/html,application/xhtml+xml",
		},
		maxBytes: PAGE_MAX_BYTES,
		what: "Page",
		contentType: /html/i,
	});
	if (r.notModified) throw new FeedSyncError("HTTP_ERROR", "Unexpected 304.");
	return r.body;
}
