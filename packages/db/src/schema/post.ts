import * as p from "drizzle-orm/pg-core";

import { user } from "./auth";
import { topic } from "./topic";

export const postStatusEnum = p.pgEnum("post_status", [
	"draft",
	"private",
	"public",
]);

/** Bài viết */
export const post = p.pgTable(
	"post",
	{
		id: p.uuid("id").primaryKey().defaultRandom(),
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		topicId: p.uuid("topic_id").references(() => topic.id, {
			onDelete: "set null",
		}),

		title: p.varchar("title", { length: 200 }).notNull().default(""),
		slug: p.varchar("slug", { length: 200 }).notNull(),
		content: p.text("content").notNull().default(""), // markdown
		excerpt: p.varchar("excerpt", { length: 280 }),

		status: postStatusEnum("status").notNull().default("draft"),

		wordCount: p.integer("word_count").notNull().default(0),
		readingTimeMinutes: p.integer("reading_time_minutes").notNull().default(0),

		publishedAt: p.timestamp("published_at"),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
		updatedAt: p
			.timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		deletedAt: p.timestamp("deleted_at"), // soft delete
	},
	(t) => [
		p.uniqueIndex("post_user_slug_unique").on(t.userId, t.slug),
		p.index("post_user_status_idx").on(t.userId, t.status),
		p.index("post_status_published_idx").on(t.status, t.publishedAt),
		p.index("post_topic_idx").on(t.topicId),
	],
);

/** Ghi chú - Suy ngẫm sau khi đọc lại, ghi chú riêng tư của chính tác giả gắn vào bài */
export const postReflectionNote = p.pgTable(
	"post_reflection_note",
	{
		id: p.uuid("id").primaryKey().defaultRandom(),
		postId: p
			.uuid("post_id")
			.notNull()
			.references(() => post.id, { onDelete: "cascade" }),
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		content: p.text("content").notNull(),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
		updatedAt: p
			.timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(t) => [p.index("post_reflection_note_post_idx").on(t.postId)],
);

/** Tương tác bài viết */
export const postReaction = p.pgTable(
	"post_reaction",
	{
		id: p.uuid("id").primaryKey().defaultRandom(),
		postId: p
			.uuid("post_id")
			.notNull()
			.references(() => post.id, { onDelete: "cascade" }),
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [
		p.uniqueIndex("post_reaction_post_user_unique").on(t.postId, t.userId),
		p.index("post_reaction_post_idx").on(t.postId),
	],
);

/** Phản hồi riêng gửi cho tác giả - KHÔNG public, không phải comment thread */
export const postReply = p.pgTable(
	"post_reply",
	{
		id: p.uuid("id").primaryKey().defaultRandom(),
		postId: p
			.uuid("post_id")
			.notNull()
			.references(() => post.id, { onDelete: "cascade" }),
		fromUserId: p
			.text("from_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		toUserId: p
			.text("to_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		content: p.text("content").notNull(),
		isRead: p.boolean("is_read").notNull().default(false),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [
		p.index("post_reply_to_user_idx").on(t.toUserId, t.isRead),
		p.index("post_reply_post_idx").on(t.postId),
	],
);
