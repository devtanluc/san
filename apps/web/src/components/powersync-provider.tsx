import { PowerSyncContext } from "@powersync/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { getPowerSyncDb, initSync } from "@/lib/powersync/database";
import Loader from "./loader";

export function PowerSyncProvider({ children }: { children: ReactNode }) {
	const [ready, setReady] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;

		initSync()
			.then(() => setReady(true))
			.catch((err) => {
				console.error("PowerSync init failed:", err);
				setError(err instanceof Error ? err : new Error(String(err)));
			});
	}, []);

	if (error) {
		return (
			<div className="flex h-screen items-center justify-center text-destructive text-sm">
				Không thể kết nối đồng bộ dữ liệu. Vui lòng thử lại.
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
