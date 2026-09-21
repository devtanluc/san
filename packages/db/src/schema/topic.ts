import * as p from "drizzle-orm/pg-core";

import { user } from "./auth";

/** Chủ đề - Đang viết về chủ đề gì, mỗi user tự quản lý chủ đề của mình */
export const topic = p.pgTable(
	"topic",
	{
		id: p.uuid("id").primaryKey().defaultRandom(),
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: p.varchar("name", { length: 60 }).notNull(),
		slug: p.varchar("slug", { length: 60 }).notNull(),
		description: p.varchar("description", { length: 160 }),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [p.uniqueIndex("topic_user_slug_unique").on(t.userId, t.slug)],
);
