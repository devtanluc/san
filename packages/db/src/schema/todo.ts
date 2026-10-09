import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const todo = pgTable("todo", {
	id: uuid("id").primaryKey().defaultRandom(),
	text: text("text").notNull(),
	completed: boolean("completed").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
});
