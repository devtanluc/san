import { PowerSyncContext } from "@powersync/react";
import { Button } from "@san/ui/components/button";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Loader } from "@/components/loader";
import { getPowerSyncDb, initSync } from "@/lib/powersync";

/**
 * Chỉ chờ database LOCAL mở xong rồi render app. Việc kết nối lên PowerSync
 * Service chạy nền trong initSync(), nên mất mạng vẫn vào được app.
 */
export function PowerSyncProvider({ children }: { children: ReactNode }) {
	const [ready, setReady] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const started = useRef(false);

	const start = useCallback(() => {
		setError(null);
		initSync()
			.then(() => setReady(true))
			.catch((err) => {
				console.error("Mở database local thất bại:", err);
				setError(err instanceof Error ? err : new Error(String(err)));
			});
	}, []);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		start();
	}, [start]);

	if (error) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-3">
				<p className="text-destructive text-sm">
					Không mở được dữ liệu cục bộ. Trình duyệt có thể đang chặn lưu trữ.
				</p>
				<Button variant="outline" size="sm" onClick={start}>
					Thử lại
				</Button>
			</div>
		);
	}

	if (!ready) {
		return <Loader />;
	}

	return (
		<PowerSyncContext.Provider value={getPowerSyncDb()}>
			{children}
		</PowerSyncContext.Provider>
	);
}
