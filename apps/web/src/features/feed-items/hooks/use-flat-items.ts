import type { ListItemsInput } from "@san/validation";
import { useMemo } from "react";
import { useItems } from "./use-items";

export function useFlatItems(search: ListItemsInput) {
	const query = useItems(search);
	const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

	return {
		items,
		isInitialLoading: query.isPending && items.length === 0,
		isFetchingNextPage: query.isFetchingNextPage,
		hasNextPage: !!query.hasNextPage,
		fetchNextPage: query.fetchNextPage,
	};
}
