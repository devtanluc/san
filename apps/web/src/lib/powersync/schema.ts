import { DrizzleAppSchema } from "@powersync/drizzle-driver";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable(
	"notes",
	{
		id: text("id").primaryKey(),
		owner_id: text("owner_id"),

		title: text("title"),
		content: text("content"),

		favorited_at: text("favorited_at"),
		pinned_at: text("pinned_at"),
		archived_at: text("archived_at"),
		trashed_at: text("trashed_at"),

		created_at: text("created_at"),
		updated_at: text("updated_at"),
	},
	(table) => [
		// Lọc theo trạng thái (inbox/archive/trash/favorites)
		index("notes_status_idx").on(table.trashed_at, table.archived_at),
		index("notes_favorited_idx").on(table.trashed_at, table.favorited_at),
		// Sort
		index("notes_pinned_idx").on(table.pinned_at),
		index("notes_created_idx").on(table.created_at),
		index("notes_updated_idx").on(table.updated_at),
		index("notes_title_idx").on(table.title),
	],
);

export const drizzleSchema = { notes };

export const AppSchema = new DrizzleAppSchema(drizzleSchema);

export type NoteRow = typeof notes.$inferSelect;
