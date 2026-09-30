import type { ListItemsInput } from "@san/validation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

export function useItems(input: Omit<ListItemsInput, "cursor">) {
	return useInfiniteQuery(
		trpc.item.list.infiniteQueryOptions(input, {
			getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		}),
	);
}

export type FeedItem = NonNullable<ReturnType<typeof useItems>["data"]>["pages"][number]["items"][number];
