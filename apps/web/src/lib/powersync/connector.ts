import type {
	CommonPowerSyncDatabase,
	CrudEntry,
	PowerSyncBackendConnector,
} from "@powersync/web";
import { UpdateType } from "@powersync/web";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { ENV } from "@/env";
import { getSession, supabase } from "@/lib/supabase";

/// Postgres Response codes that we cannot recover from by retrying.
const FATAL_RESPONSE_CODES = [
	// Class 22 — Data Exception
	// Examples include data type mismatch.
	new RegExp(/^22...$/),
	// Class 23 — Integrity Constraint Violation.
	// Examples include NOT NULL, FOREIGN KEY and UNIQUE violations.
	new RegExp(/^23...$/),
	// INSUFFICIENT PRIVILEGE - typically a row-level security violation
	new RegExp(/^42501$/),
];

async function fetchCredentials() {
	const session = await getSession();

	if (!session) {
		throw new Error("Could not fetch Supabase credentials: no session");
	}

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

	if (!transaction) {
		return;
	}

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
							`PATCH operation on table "${op.table}" (id: ${op.id}) is missing opData`,
						);
					}
					result = await table.update(op.opData).eq("id", op.id);
					break;
				case UpdateType.DELETE:
					result = await table.delete().eq("id", op.id);
					break;
			}

			if (result.error) {
				console.error(result.error);
				result.error.message = `Could not update Supabase. Received error: ${result.error.message}`;
				throw result.error;
			}
		}

		await transaction.complete();
		// biome-ignore lint/suspicious/noExplicitAny: ignore
	} catch (ex: any) {
		console.debug(ex);
		if (
			typeof ex.code === "string" &&
			FATAL_RESPONSE_CODES.some((regex) => regex.test(ex.code))
		) {
			/**
			 * Instead of blocking the queue with these errors,
			 * discard the (rest of the) transaction.
			 *
			 * Note that these errors typically indicate a bug in the application.
			 * If protecting against data loss is important, save the failing records
			 * elsewhere instead of discarding, and/or notify the user.
			 */
			console.error("Data upload error - discarding:", lastOp, ex);
			await transaction.complete();
		} else {
			// Error may be retryable - e.g. network error or temporary server error.
			// Throwing an error here causes this call to be retried after a delay.
			throw ex;
		}
	}
}

export const connector: PowerSyncBackendConnector = {
	fetchCredentials,
	uploadData,
};
