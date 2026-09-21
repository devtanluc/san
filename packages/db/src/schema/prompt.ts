import * as p from "drizzle-orm/pg-core";

import { user } from "./auth";

export const promptSet = p.pgTable(
	"prompt_set",
	{
		id: p.uuid("id").primaryKey().defaultRandom(),
		// null userId = bộ prompt hệ thống (Biết ơn, Quyết định, Bài học...)
		userId: p.text("user_id").references(() => user.id, {
			onDelete: "cascade",
		}),
		name: p.varchar("name", { length: 60 }).notNull(),
		slug: p.varchar("slug", { length: 60 }).notNull(),
		description: p.varchar("description", { length: 160 }),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [p.uniqueIndex("prompt_set_slug_unique").on(t.slug)],
);

export const prompt = p.pgTable(
	"prompt",
	{
		id: p.uuid("id").primaryKey().defaultRandom(),
		setId: p
			.uuid("set_id")
			.notNull()
			.references(() => promptSet.id, { onDelete: "cascade" }),
		text: p.text("text").notNull(),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [p.index("prompt_set_idx").on(t.setId)],
);

export const savedPrompt = p.pgTable(
	"saved_prompt",
	{
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		promptId: p
			.uuid("prompt_id")
			.notNull()
			.references(() => prompt.id, { onDelete: "cascade" }),
		createdAt: p.timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [p.primaryKey({ columns: [t.userId, t.promptId] })],
);
