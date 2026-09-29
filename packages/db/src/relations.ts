import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	user: {
		sessions: r.many.session({
			from: r.user.id,
			to: r.session.userId,
		}),
		accounts: r.many.account({
			from: r.user.id,
			to: r.account.userId,
		}),
		feeds: r.many.feed({
			from: r.user.id,
			to: r.feed.userId,
		}),
		tags: r.many.tag({
			from: r.user.id,
			to: r.tag.userId,
		}),
	},
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id,
		}),
	},
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id,
		}),
	},
	feed: {
		user: r.one.user({
			from: r.feed.userId,
			to: r.user.id,
			optional: false,
		}),
		items: r.many.item({
			from: r.feed.id,
			to: r.item.feedId,
		}),
	},
	item: {
		feed: r.one.feed({
			from: r.item.feedId,
			to: r.feed.id,
			optional: false,
		}),
		// Lịch sử tóm tắt (nếu regenerate nhiều lần); lấy bản mới nhất
		// bằng orderBy khi query, ví dụ: orderBy: { generatedAt: "desc" }
		summaries: r.many.summary({
			from: r.item.id,
			to: r.summary.itemId,
		}),
		// Many-to-many qua bảng nối item_tag
		tags: r.many.tag({
			from: r.item.id.through(r.itemTag.itemId),
			to: r.tag.id.through(r.itemTag.tagId),
		}),
	},
	summary: {
		item: r.one.item({
			from: r.summary.itemId,
			to: r.item.id,
			optional: false,
		}),
	},
	tag: {
		user: r.one.user({
			from: r.tag.userId,
			to: r.user.id,
			optional: false,
		}),
		items: r.many.item({
			from: r.tag.id.through(r.itemTag.tagId),
			to: r.item.id.through(r.itemTag.itemId),
		}),
	},
}));
