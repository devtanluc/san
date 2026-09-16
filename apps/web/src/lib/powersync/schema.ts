import { DrizzleAppSchema } from "@powersync/drizzle-driver";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
	id: text("id").primaryKey(),
	owner_id: text("owner_id"),
	title: text("title"),
	content: text("content"),
	created_at: text("created_at"),
	updated_at: text("updated_at"),
});

export const drizzleSchema = { notes };
export const AppSchema = new DrizzleAppSchema(drizzleSchema);
