import got, { HTTPError, MaxRedirectsError, type PlainResponse, TimeoutError } from "got";
import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from "request-filtering-agent";

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
const FEED_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const PAGE_MAX_BYTES = 3 * 1024 * 1024; // 3MB

// Agent chặn IP private/loopback/link-local ngay lúc tạo socket (chống DNS rebinding, áp dụng cả cho mỗi redirect)
const agent = {
	http: new RequestFilteringHttpAgent(),
	https: new RequestFilteringHttpsAgent(),
};

type GuardedOptions = {
	headers: Record<string, string>;
	maxBytes: number;
	what: "Feed" | "Page";
	contentType?: RegExp; // nếu có, từ chối response không khớp trước khi đọc body
};

type GuardedResult = { notModified: true } | { notModified: false; body: string; res: PlainResponse };

function mapError(e: unknown, what: string): FeedSyncError {
	if (e instanceof FeedSyncError) return e;
	if (e instanceof TimeoutError) return new FeedSyncError("TIMEOUT", `${what} took too long to respond.`);
	if (e instanceof HTTPError)
		return new FeedSyncError("HTTP_ERROR", `${what} returned HTTP ${e.response.statusCode}.`);
	if (e instanceof MaxRedirectsError) return new FeedSyncError("HTTP_ERROR", "Too many redirects.");
	// request-filtering-agent ném lỗi có message "... is not allowed ..." khi gặp IP nội bộ
	if (e instanceof Error && /is not allowed/i.test(e.message)) {
		return new FeedSyncError("BLOCKED_URL", "This URL is not allowed.");
	}
	if (e instanceof Error && e.name === "UnsupportedProtocolError") {
		return new FeedSyncError("BLOCKED_URL", "Only http/https URLs are allowed.");
	}
	return new FeedSyncError("NETWORK", `Could not reach the ${what.toLowerCase()}.`);
}

async function fetchGuarded(rawUrl: string, opts: GuardedOptions): Promise<GuardedResult> {
	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch {
		throw new FeedSyncError("BLOCKED_URL", "Invalid URL.");
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new FeedSyncError("BLOCKED_URL", "Only http/https URLs are allowed.");
	}

	const stream = got.stream(url, {
		agent,
		headers: opts.headers,
		timeout: { request: TIMEOUT_MS },
		maxRedirects: MAX_REDIRECTS,
		retry: { limit: 0 },
	});

	let res: PlainResponse | undefined;
	let rejected: FeedSyncError | undefined;

	stream.once("response", (r: PlainResponse) => {
		res = r;
		if (
			r.statusCode !== 304 &&
			opts.contentType &&
			!opts.contentType.test(String(r.headers["content-type"] ?? ""))
		) {
			rejected = new FeedSyncError("HTTP_ERROR", `${opts.what} is not an HTML document.`);
			stream.destroy();
		}
	});

	try {
		const chunks: Buffer[] = [];
		let total = 0;
		for await (const chunk of stream) {
			total += (chunk as Buffer).byteLength;
			if (total > opts.maxBytes) {
				stream.destroy();
				throw new FeedSyncError("TOO_LARGE", `${opts.what} is too large.`);
			}
			chunks.push(chunk as Buffer);
		}
		if (rejected) throw rejected;
		if (!res) throw new FeedSyncError("NETWORK", `Could not reach the ${opts.what.toLowerCase()}.`);
		if (res.statusCode === 304) return { notModified: true };
		return { notModified: false, body: Buffer.concat(chunks).toString("utf8"), res };
	} catch (e) {
		throw rejected ?? mapError(e, opts.what);
	}
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
		etag: r.res.headers.etag ?? null,
		lastModified: r.res.headers["last-modified"] ?? null,
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
