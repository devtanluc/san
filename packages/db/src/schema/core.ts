import * as p from "drizzle-orm/pg-core";
import { user } from "./auth";

// Luôn dùng timestamptz để tránh lệch giờ khi đổi timezone/server
const timestamptz = (name: string) => p.timestamp(name, { withTimezone: true });

export const feedTypeEnum = p.pgEnum("feed_type", ["rss", "podcast", "youtube", "twitter"]);

export const feed = p.pgTable(
	"feed",
	{
		id: p.uuid().primaryKey().defaultRandom(),
		// Xoá user -> xoá luôn toàn bộ feed của user đó
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: feedTypeEnum().notNull(),
		url: p.text().notNull(),
		title: p.text().notNull(),
		iconUrl: p.text("icon_url"),
		// Metadata cho sync: dùng conditional GET (If-None-Match / If-Modified-Since)
		etag: p.text(),
		lastModified: p.text("last_modified"),
		lastFetchedAt: timestamptz("last_fetched_at"),
		createdAt: timestamptz("created_at").notNull().defaultNow(),
	},
	// Chặn user subscribe trùng 1 url 2 lần (url phải được chuẩn hoá trước khi lưu)
	(t) => [p.unique("feed_user_url_unique").on(t.userId, t.url)],
);

export const item = p.pgTable(
	"item",
	{
		id: p.uuid().primaryKey().defaultRandom(),
		// Xoá feed -> xoá toàn bộ item của feed đó
		feedId: p
			.uuid("feed_id")
			.notNull()
			.references(() => feed.id, { onDelete: "cascade" }),
		// <guid> / <id> của bài trong feed (nullable vì có feed không cung cấp)
		guid: p.text(),
		title: p.text().notNull(),
		url: p.text().notNull(),
		// item
		author: p.text(),
		imageUrl: p.text("image_url"),
		enclosureUrl: p.text("enclosure_url"), // file audio cho podcast
		enclosureType: p.text("enclosure_type"),
		durationSec: p.integer("duration_sec"),
		// Nội dung gốc từ RSS (HTML thuần)
		contentRaw: p.text("content_raw"),
		// Nội dung đã làm sạch (dùng để hiển thị và đưa cho AI tóm tắt)
		contentClean: p.text("content_clean"),
		// Thời điểm bài được đăng (nullable vì có feed không cung cấp)
		publishedAt: timestamptz("published_at"),
		// Thời điểm hệ thống fetch về
		fetchedAt: timestamptz("fetched_at").notNull().defaultNow(),
		isRead: p.boolean("is_read").notNull().default(false),
		isFavorite: p.boolean("is_favorite").notNull().default(false),
	},
	(t) => [
		// Dedup theo url (fallback khi feed không có guid)
		p.unique("item_feed_url_unique").on(t.feedId, t.url),
		// Dedup theo guid (bền hơn url). Postgres cho phép nhiều NULL nên feed không guid vẫn ổn
		p.unique("item_feed_guid_unique").on(t.feedId, t.guid),
		// Timeline theo feed, bài mới nhất trước
		// Khi query nên sort theo coalesce(published_at, fetched_at) vì published_at có thể null
		p.index("item_feed_published_idx").on(t.feedId, t.publishedAt.desc()),
	],
);

export const summary = p.pgTable(
	"summary",
	{
		id: p.uuid().primaryKey().defaultRandom(),
		// Xoá item -> xoá summary
		itemId: p
			.uuid("item_id")
			.notNull()
			.references(() => item.id, { onDelete: "cascade" }),
		summaryText: p.text("summary_text").notNull(),
		// Model đã dùng để tạo summary
		model: p.text(),
		// Thời điểm summary được tạo
		generatedAt: timestamptz("generated_at").notNull().defaultNow(),
	},
	(t) => [
		// Mỗi item chỉ có 1 summary
		p.unique("summary_item_unique").on(t.itemId),
	],
);

export const tag = p.pgTable(
	"tag",
	{
		id: p.uuid().primaryKey().defaultRandom(),
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: p.text().notNull(),
	},
	// Tránh 1 user tạo 2 tag cùng tên
	(t) => [p.unique("tag_user_name_unique").on(t.userId, t.name)],
);

// Bảng nối many-to-many giữa item và tag
export const itemTag = p.pgTable(
	"item_tag",
	{
		itemId: p
			.uuid("item_id")
			.notNull()
			.references(() => item.id, { onDelete: "cascade" }),
		tagId: p
			.uuid("tag_id")
			.notNull()
			.references(() => tag.id, { onDelete: "cascade" }),
	},
	(t) => [p.primaryKey({ columns: [t.itemId, t.tagId] }), p.index("item_tag_tag_id_idx").on(t.tagId)],
);
