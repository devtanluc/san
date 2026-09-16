import type { PowerSyncBackendConnector, PowerSyncDatabase } from "@powersync/web";
import { supabase } from "@/lib/supabase";

type ConnectOptions = Parameters<PowerSyncDatabase["connect"]>[1];

/**
 * Nối vòng đời auth của Supabase với vòng đời kết nối của PowerSync.
 *
 * - SIGNED_OUT: ngắt kết nối VÀ xoá sạch DB local. Không làm bước này thì dữ liệu
 *   của user cũ vẫn nằm trong OPFS/IndexedDB và user sau sẽ thấy nó.
 * - SIGNED_IN: kết nối lại (ví dụ sau khi đăng nhập ẩn danh xong, hoặc đổi tài khoản).
 * - TOKEN_REFRESHED: không cần làm gì, PowerSync tự gọi fetchCredentials().
 *
 * Trả về hàm unsubscribe.
 */
export function startAuthBridge(
	db: PowerSyncDatabase,
	connector: PowerSyncBackendConnector,
	options?: ConnectOptions,
): () => void {
	const {
		data: { subscription },
	} = supabase.auth.onAuthStateChange((event) => {
		void (async () => {
			try {
				switch (event) {
					case "SIGNED_OUT":
						await db.disconnectAndClear();
						break;
					case "SIGNED_IN":
						if (!db.connected) {
							await db.connect(connector, options);
						}
						break;
					default:
						break;
				}
			} catch (err) {
				console.error(`Xử lý auth event "${event}" thất bại:`, err);
			}
		})();
	});

	return () => subscription.unsubscribe();
}
