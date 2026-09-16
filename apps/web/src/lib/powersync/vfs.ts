import { WASQLiteVFS } from "@powersync/web";

/**
 * Kiểm tra OPFS có thực sự dùng được không, không chỉ dựa vào API có tồn tại.
 * Safari Private Browsing expose API nhưng reject khi gọi getDirectory().
 */
async function isOPFSUsable(): Promise<boolean> {
	if (
		typeof navigator === "undefined" ||
		typeof navigator.storage?.getDirectory !== "function" ||
		typeof Worker !== "function"
	) {
		return false;
	}
	try {
		await navigator.storage.getDirectory();
		return true;
	} catch {
		return false;
	}
}

export async function resolveVFS(): Promise<WASQLiteVFS> {
	const usable = await isOPFSUsable();
	return usable ? WASQLiteVFS.OPFSCoopSyncVFS : WASQLiteVFS.IDBBatchAtomicVFS;
}
