import * as p from "drizzle-orm/pg-core";

import { user } from "./auth";
import { post } from "./post";

export const reviewPeriodEnum = p.pgEnum("review_period", ["week", "month"]);

/** Theo dõi */
export const follow = p.pgTable(
	"follow",
	{
		followerId: p
			.text("follower_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		followingId: p
			.text("following_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [
		p.primaryKey({ columns: [t.followerId, t.followingId] }),
		p.index("follow_following_idx").on(t.followingId),
	],
);

/** Đăng ký */
export const subscription = p.pgTable(
	"subscription",
	{
		id: p.uuid("id").primaryKey().defaultRandom(),
		authorId: p
			.text("author_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		subscriberUserId: p.text("subscriber_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		email: p.text("email").notNull(),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [
		p.uniqueIndex("subscription_author_email_unique").on(t.authorId, t.email),
	],
);

/** Cột mốc tự đánh dấu trên timeline (có thể gắn hoặc không gắn với 1 bài) */
export const milestone = p.pgTable(
	"milestone",
	{
		id: p.uuid("id").primaryKey().defaultRandom(),
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		postId: p.uuid("post_id").references(() => post.id, {
			onDelete: "set null",
		}),
		title: p.varchar("title", { length: 140 }).notNull(),
		note: p.text("note"),
		occurredAt: p.timestamp("occurred_at").notNull(),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [p.index("milestone_user_occurred_idx").on(t.userId, t.occurredAt)],
);

/** Đọc lại - ghi chú "Bây giờ bạn nghĩ gì?" khi đọc lại 1 bài cũ */
export const rereadNote = p.pgTable(
	"reread_note",
	{
		id: p.uuid("id").primaryKey().defaultRandom(),
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		postId: p
			.uuid("post_id")
			.notNull()
			.references(() => post.id, { onDelete: "cascade" }),
		content: p.text("content").notNull(),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [p.index("reread_note_user_post_idx").on(t.userId, t.postId)],
);

/** Weekly / Monthly review - trả lời 3 câu hỏi có sẵn (lưu dạng jsonb text[]) */
export const periodReview = p.pgTable(
	"period_review",
	{
		id: p.uuid("id").primaryKey().defaultRandom(),
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		period: reviewPeriodEnum("period").notNull(),
		periodStart: p.timestamp("period_start").notNull(),
		answers: p.text("answers").array().notNull().default([]), // 3 câu trả lời, theo thứ tự câu hỏi
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [
		p
			.uniqueIndex("period_review_user_period_unique")
			.on(t.userId, t.period, t.periodStart),
	],
);
