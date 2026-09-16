import { pgSchema, uuid } from "drizzle-orm/pg-core";

// Select auth schema from Supabase
export const authSchema = pgSchema("auth");

// Select users table from auth schema
export const authUsers = authSchema.table("users", {
	id: uuid("id").primaryKey(),
});
