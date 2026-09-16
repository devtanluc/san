import { wrapPowerSyncWithDrizzle } from "@powersync/drizzle-driver";
import {
	createConsoleLogger,
	LogLevels,
	PowerSyncDatabase,
} from "@powersync/web";
import { startAuthBridge } from "./auth-bridge";
import { connector } from "./connector";
import { AppSchema, drizzleSchema } from "./schema";
import { resolveVFS } from "./vfs";

export type AppDatabase = ReturnType<typeof wrapPowerSyncWithDrizzle>;

const logger = createConsoleLogger({
	minLevel: import.meta.env.DEV ? LogLevels.debug : LogLevels.warn,
});

const CONNECT_OPTIONS = {
	// 1s: đủ gom nhiều thao tác liên tiếp thành 1 lượt upload,
	// nhưng vẫn cảm giác tức thì. 5s là quá lâu cho app note.
	crudUploadThrottleMs: 1000,
	// KHÔNG bật checkpointMode: "requests" trừ khi PowerSync Service >= 1.24.0
	// và bạn thực sự gọi requestCheckpoint(). Đây là alpha API.
};

let powerSyncDb: PowerSyncDatabase | undefined;
let db: AppDatabase | undefined;
let initPromise: Promise<void> | null = null;
let stopAuthBridge: (() => void) | null = null;

/**
 * Mở database local. Chỉ chờ tới khi local DB sẵn sàng — việc connect lên
 * PowerSync Service chạy nền, KHÔNG block UI. Đây là điểm mấu chốt của
 * offline-first: mất mạng thì app vẫn dùng được với dữ liệu đã sync.
 */
export function initSync(): Promise<void> {
	initPromise ??= openDatabase().catch((err) => {
		// Reset để lần gọi sau có thể thử lại. Nếu giữ nguyên promise đã reject
		// (hoặc dùng cờ boolean) thì app sẽ kẹt vĩnh viễn ở trạng thái nửa vời.
		initPromise = null;
		powerSyncDb = undefined;
		db = undefined;
		throw err;
	});

	return initPromise;
}

async function openDatabase(): Promise<void> {
	const vfs = await resolveVFS();

	powerSyncDb = new PowerSyncDatabase({
		database: { dbFilename: "san.db", vfs },
		schema: AppSchema,
		logger,
	});

	db = wrapPowerSyncWithDrizzle(powerSyncDb, { schema: drizzleSchema });

	await powerSyncDb.init();

	stopAuthBridge?.();
	stopAuthBridge = startAuthBridge(powerSyncDb, connector, CONNECT_OPTIONS);

	// Không await: connect có thể treo rất lâu khi mạng yếu.
	void connectInBackground();
}

async function connectInBackground(): Promise<void> {
	if (!powerSyncDb) return;

	try {
		await powerSyncDb.connect(connector, CONNECT_OPTIONS);
	} catch (err) {
		// Không throw ra ngoài: local DB vẫn dùng bình thường.
		// PowerSync tự retry, và auth-bridge sẽ connect lại khi có session.
		console.error("PowerSync connect thất bại (app vẫn chạy offline):", err);
	}
}

/** Thử kết nối lại thủ công, ví dụ từ nút "Retry" trên UI. */
export function reconnect(): Promise<void> {
	return connectInBackground();
}

export function getPowerSyncDb(): PowerSyncDatabase {
	if (!powerSyncDb) {
		throw new Error("PowerSync chưa được khởi tạo — gọi initSync() trước.");
	}
	return powerSyncDb;
}

export function getDb(): AppDatabase {
	if (!db) {
		throw new Error("PowerSync chưa được khởi tạo — gọi initSync() trước.");
	}
	return db;
}

/** Dùng trong test hoặc khi cần tear down hoàn toàn. */
export async function disposeSync(): Promise<void> {
	stopAuthBridge?.();
	stopAuthBridge = null;
	await powerSyncDb?.disconnect();
	await powerSyncDb?.close();
	powerSyncDb = undefined;
	db = undefined;
	initPromise = null;
}
