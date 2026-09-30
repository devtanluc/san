import { feed, item } from "@san/db/schema";
import { normalizeUrl } from "@san/validation";
import { eq } from "drizzle-orm";
import {
	DetectError,
	detectAtomFeed,
	detectJsonFeed,
	detectRdfFeed,
	detectRssFeed,
	MalformedError,
	ParseError,
	parseAtomFeed,
	parseJsonFeed,
	parseRdfFeed,
	parseRssFeed,
} from "feedsmith";
import type { Context } from "../context";
import { FeedSyncError, safeFetchFeed } from "../lib/safe-fetch";

type Db = Context["db"];
type FeedRow = typeof feed.$inferSelect;

const MAX_ITEMS_PER_SYNC = 200;

// * Parse (feedsmith 3.x)

// Bài viết đã được chuẩn hoá về 1 dạng chung, bất kể feed là RSS, RDF, Atom hay JSON Feed
type RawItem = {
	guid: string | null;
	url: string | null;
	title: string | null;
	content: string | null;
	publishedAt: Date | null;
};

// feedsmith trả date dạng string nguyên bản, tự parse qua parseDateFn.
// Date không hợp lệ -> undefined (field bị bỏ) thay vì để Invalid Date lọt vào DB.
const parseDateFn = (raw: string): Date | undefined => {
	const d = new Date(raw);
	return Number.isNaN(d.getTime()) ? undefined : d;
};

const parseOptions = { maxItems: MAX_ITEMS_PER_SYNC, parseDateFn };

type FeedFormat = "rss" | "rdf" | "atom" | "json";

// feedsmith 3.0.1 chưa có detectFeed (bản mới hơn mới có), nên tự ghép từ các hàm detect riêng.
// JSON kiểm tra trước: JSON Feed có nội dung nhắc tới thẻ XML thì detector XML có thể nhận nhầm.
function detectFormat(body: string): FeedFormat | undefined {
	if (detectJsonFeed(body)) return "json";
	if (detectRssFeed(body)) return "rss";
	if (detectAtomFeed(body)) return "atom";
	if (detectRdfFeed(body)) return "rdf";
	return undefined;
}

function extractItems(body: string): RawItem[] {
	const format = detectFormat(body);

	switch (format) {
		case "rss": {
			const parsed = parseRssFeed(body, parseOptions);
			return (parsed.items ?? []).map((it) => {
				const guid = it.guid?.value ?? null;
				return {
					guid,
					// Thiếu <link> thì dùng guid nếu nó là permalink (mặc định theo spec RSS)
					url: it.link ?? (it.guid?.isPermaLink === false ? null : guid),
					title: it.title ?? null,
					content: it.content?.encoded ?? it.description ?? null,
					publishedAt: it.pubDate ?? it.dc?.dates?.[0] ?? null,
				};
			});
		}

		case "rdf": {
			const parsed = parseRdfFeed(body, parseOptions);
			return (parsed.items ?? []).map((it) => ({
				guid: null, // RSS 1.0 không có guid
				url: it.link ?? null,
				title: it.title ?? null,
				content: it.content?.encoded ?? it.description ?? null,
				publishedAt: it.dc?.dates?.[0] ?? null,
			}));
		}

		case "atom": {
			const parsed = parseAtomFeed(body, parseOptions);
			return (parsed.entries ?? []).map((entry) => {
				// Link của bài là rel="alternate" (hoặc không có rel), khác với rel="self", "edit"...
				const link =
					entry.links?.find((l) => !l.rel || l.rel === "alternate")?.href ?? entry.links?.[0]?.href ?? null;
				return {
					guid: entry.id ?? null,
					url: link,
					title: entry.title?.value ?? null,
					content: entry.content?.value ?? entry.summary?.value ?? null,
					publishedAt: entry.published ?? entry.updated ?? null,
				};
			});
		}

		case "json": {
			const parsed = parseJsonFeed(body, parseOptions);
			return (parsed.items ?? []).map((it) => ({
				guid: it.id ?? null,
				url: it.url ?? it.external_url ?? null,
				title: it.title ?? null,
				content: it.content_html ?? it.content_text ?? null,
				publishedAt: it.date_published ?? it.date_modified ?? null,
			}));
		}

		default:
			throw new FeedSyncError("INVALID_FEED", "This URL is not a valid RSS/Atom feed.");
	}
}

function toHttpUrl(raw: string | null): string | null {
	if (!raw) return null;
	try {
		const u = new URL(raw.trim());
		if (u.protocol !== "http:" && u.protocol !== "https:") return null;
		return normalizeUrl(u.toString());
	} catch {
		return null;
	}
}

// * Sync

export type SyncResult = { inserted: number; notModified: boolean };

export async function syncFeed(db: Db, row: FeedRow): Promise<SyncResult> {
	const res = await safeFetchFeed(row.url, { etag: row.etag, lastModified: row.lastModified });

	if (res.notModified) {
		await db.update(feed).set({ lastFetchedAt: new Date() }).where(eq(feed.id, row.id));
		return { inserted: 0, notModified: true };
	}

	let rawItems: RawItem[];
	try {
		// Bỏ BOM đầu file (một số feed có) để detect/parse không hụt
		rawItems = extractItems(res.body.replace(/^\uFEFF/, ""));
	} catch (e) {
		if (e instanceof DetectError || e instanceof MalformedError || e instanceof ParseError) {
			throw new FeedSyncError("INVALID_FEED", "This URL is not a valid RSS/Atom feed.");
		}
		throw e; // FeedSyncError hoặc lỗi bất ngờ -> để router xử lý
	}

	const values = rawItems.flatMap((it) => {
		const url = toHttpUrl(it.url);
		if (!url) return []; // bỏ bài không có link hợp lệ
		return [
			{
				feedId: row.id,
				guid: it.guid?.trim() || null,
				url,
				title: it.title?.trim() || url,
				// contentClean: để pipeline làm sạch HTML xử lý sau (sanitize + trích text)
				contentRaw: it.content,
				publishedAt: it.publishedAt,
			},
		];
	});

	let inserted = 0;
	if (values.length > 0) {
		// Không chỉ định target -> bỏ qua trùng cả (feedId, url) lẫn (feedId, guid)
		const rows = await db.insert(item).values(values).onConflictDoNothing().returning({ id: item.id });
		inserted = rows.length;
	}

	await db
		.update(feed)
		.set({ etag: res.etag, lastModified: res.lastModified, lastFetchedAt: new Date() })
		.where(eq(feed.id, row.id));

	return { inserted, notModified: false };
}
