import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import {
	createConsoleLogger,
	LogLevels,
	PowerSyncDatabase,
} from "@powersync/web";
import { signInAnonymously } from "@/lib/supabase";
import { connector } from "./connector";
import { AppSchema, drizzleSchema } from "./schema";
import { resolveVFS } from "./vfs";

const logger = createConsoleLogger({ minLevel: LogLevels.debug });

let powerSyncDb: PowerSyncDatabase | undefined;
let db: ReturnType<typeof wrapPowerSyncWithDrizzle> | undefined;

/**
 * Khởi tạo PowerSyncDatabase + kết nối.
 */
export async function initSync() {
	if (powerSyncDb) return; // đã init rồi, tránh double-connect (StrictMode...)

	const vfs = await resolveVFS();

	powerSyncDb = new PowerSyncDatabase({
		database: { dbFilename: "san.db", vfs },
		schema: AppSchema,
		logger,
	});

	db = wrapPowerSyncWithDrizzle(powerSyncDb, { schema: drizzleSchema });

	await signInAnonymously();

	await powerSyncDb.connect(connector, {
		crudUploadThrottleMs: 5000,
		checkpointMode: "requests",
	});

	if (powerSyncDb && db) {
		console.log("PowerSync đã được khởi tạo");
	}
}

export function getPowerSyncDb() {
	if (!powerSyncDb)
		throw new Error("PowerSync chưa được khởi tạo — gọi initSync() trước.");
	return powerSyncDb;
}

export function getDb() {
	if (!db)
		throw new Error("PowerSync chưa được khởi tạo — gọi initSync() trước.");
	return db;
}
