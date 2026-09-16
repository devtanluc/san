import type {
	CommonPowerSyncDatabase,
	CrudEntry,
	PowerSyncBackendConnector,
	PowerSyncCredentials,
} from "@powersync/web";
import { UpdateType } from "@powersync/web";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { ENV } from "@/env";
import { ensureSession, supabase } from "@/lib/supabase";

/** Postgres response codes không thể cứu được bằng retry. */
const FATAL_RESPONSE_CODES = [
	// Class 22 — Data Exception (sai kiểu dữ liệu...)
	/^22...$/,
	// Class 23 — Integrity Constraint Violation (NOT NULL, FK, UNIQUE...)
	/^23...$/,
	// INSUFFICIENT PRIVILEGE — thường là vi phạm row-level security
	/^42501$/,
];

/**
 * PowerSync gọi hàm này khi cần token mới (lúc connect và khi token sắp hết hạn).
 * Dùng ensureSession() để nếu session bị mất thì tự đăng nhập ẩn danh lại,
 * thay vì kẹt trong vòng lặp retry vô hạn.
 */
async function fetchCredentials(): Promise<PowerSyncCredentials> {
	const session = await ensureSession();

	return {
		endpoint: ENV.VITE_POWERSYNC_URL,
		token: session.access_token,
		expiresAt: session.expires_at
			? new Date(session.expires_at * 1000)
			: undefined,
	};
}

async function uploadData(database: CommonPowerSyncDatabase): Promise<void> {
	const transaction = await database.getNextCrudTransaction();
	if (!transaction) return;

	let lastOp: CrudEntry | null = null;

	try {
		for (const op of transaction.crud) {
			lastOp = op;
			const table = supabase.from(op.table);
			let result: PostgrestSingleResponse<null>;

			switch (op.op) {
				case UpdateType.PUT:
					result = await table.upsert({ ...op.opData, id: op.id });
					break;
				case UpdateType.PATCH:
					if (!op.opData) {
						throw new Error(
							`PATCH trên bảng "${op.table}" (id: ${op.id}) thiếu opData`,
						);
					}
					result = await table.update(op.opData).eq("id", op.id);
					break;
				case UpdateType.DELETE:
					result = await table.delete().eq("id", op.id);
					break;
			}

			if (result.error) {
				result.error.message = `Không update được Supabase: ${result.error.message}`;
				throw result.error;
			}
		}

		await transaction.complete();
	} catch (ex) {
		const code = (ex as { code?: unknown }).code;

		if (
			typeof code === "string" &&
			FATAL_RESPONSE_CODES.some((regex) => regex.test(code))
		) {
			/**
			 * Không block queue bằng các lỗi này — bỏ (phần còn lại của) transaction.
			 * Các lỗi này thường là bug ứng dụng. Nếu chống mất dữ liệu là quan trọng,
			 * hãy lưu record lỗi ra chỗ khác / báo cho user thay vì discard.
			 */
			console.error("Upload lỗi không thể retry — bỏ qua:", lastOp, ex);
			await transaction.complete();
		} else {
			// Lỗi mạng / lỗi server tạm thời — throw để PowerSync retry sau một khoảng delay.
			throw ex;
		}
	}
}

export const connector: PowerSyncBackendConnector = {
	fetchCredentials,
	uploadData,
};
