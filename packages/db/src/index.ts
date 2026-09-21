import { drizzle } from "drizzle-orm/node-postgres";

import type { DatabaseConfig } from "./config";
import { relations } from "./schema/relations";

export function createDb(env: DatabaseConfig) {
	return drizzle(env.DATABASE_URL, { relations });
}

export type Database = ReturnType<typeof createDb>;
