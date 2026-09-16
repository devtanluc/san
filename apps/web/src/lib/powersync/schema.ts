import { DrizzleAppSchema } from "@powersync/drizzle-driver";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
	id: text("id").primaryKey(),
	owner_id: text("owner_id"),

	title: text("title").notNull().default(""),
	content: text("content").notNull().default(""),

	pinned_at: text("pinned_at"),
	archived_at: text("archived_at"),
	trashed_at: text("trashed_at"),

	created_at: text("created_at").notNull(),
	updated_at: text("updated_at").notNull(),
});

export const drizzleSchema = { notes };
export const AppSchema = new DrizzleAppSchema(drizzleSchema);

export type Note = typeof notes.$inferSelect;
