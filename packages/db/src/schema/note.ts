import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "./auth";

export const notes = pgTable("notes", {
	id: uuid("id").primaryKey().defaultRandom(),
	ownerId: uuid("owner_id")
		.notNull()
		.references(() => authUsers.id, { onDelete: "cascade" }),

	title: text("title").notNull().default(""),
	content: text("content").notNull().default(""),

	pinnedAt: timestamp("pinned_at", { withTimezone: true }),
	archivedAt: timestamp("archived_at", { withTimezone: true }),
	trashedAt: timestamp("trashed_at", { withTimezone: true }),

	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});
