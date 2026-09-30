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
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
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

function mapNetworkError(e: unknown): FeedSyncError {
	if (e instanceof FeedSyncError) return e;
	if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
		return new FeedSyncError("TIMEOUT", "Feed took too long to respond.");
	}
	return new FeedSyncError("NETWORK", "Could not reach the feed.");
}

async function readLimited(res: Response): Promise<string> {
	const reader = res.body?.getReader();
	if (!reader) return "";
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > MAX_BYTES) {
			await reader.cancel();
			throw new FeedSyncError("TOO_LARGE", "Feed is too large.");
		}
		chunks.push(value);
	}
	return Buffer.concat(chunks).toString("utf8");
}

export type SafeFetchResult =
	| { notModified: true }
	| { notModified: false; body: string; etag: string | null; lastModified: string | null };

/**
 * Fetch feed với: chặn IP nội bộ (kiểm tra lại sau mỗi redirect), timeout, giới hạn dung lượng,
 * conditional GET (ETag / Last-Modified).
 *
 * Giới hạn đã biết: DNS được resolve 2 lần (lúc kiểm tra và lúc fetch) nên về lý thuyết còn
 * hở DNS rebinding. Muốn kín hoàn toàn thì dùng undici Agent với `connect.lookup` tự kiểm tra IP.
 */
export async function safeFetchFeed(
	rawUrl: string,
	cond: { etag?: string | null; lastModified?: string | null } = {},
): Promise<SafeFetchResult> {
	const signal = AbortSignal.timeout(TIMEOUT_MS);
	const headers: Record<string, string> = {
		"User-Agent": "SanReader/1.0 (+feed sync)",
		Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
	};
	if (cond.etag) headers["If-None-Match"] = cond.etag;
	if (cond.lastModified) headers["If-Modified-Since"] = cond.lastModified;

	let current = rawUrl;
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		await assertPublicUrl(current);

		try {
			const res = await fetch(current, { redirect: "manual", signal, headers });

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
				throw new FeedSyncError("HTTP_ERROR", `Feed returned HTTP ${res.status}.`);
			}

			const body = await readLimited(res);
			return {
				notModified: false,
				body,
				etag: res.headers.get("etag"),
				lastModified: res.headers.get("last-modified"),
			};
		} catch (e) {
			throw mapNetworkError(e);
		}
	}

	throw new FeedSyncError("HTTP_ERROR", "Too many redirects.");
}
