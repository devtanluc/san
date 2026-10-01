import type { ListItemsInput } from "@san/validation";
import type { ComponentProps } from "react";
import { InfiniteScrollSentinel } from "@/components/shared/infinite-scroll-sentinel";
import { PanelHeader } from "@/components/shared/panel-header";
import { FeedItemRow } from "./feed-item-row";
import { FeedItemRowSkeleton } from "./feed-item-row-skeleton";
import { StatusSwitcher } from "./status-switcher";

type Item = ComponentProps<typeof FeedItemRow>["item"];

type Props = {
	filter: ListItemsInput["filter"];
	items: Item[];
	activeItemId?: string;
	isInitialLoading: boolean;
	isFetchingNextPage: boolean;
	hasNextPage: boolean;
	onFilterChange: (filter: ListItemsInput["filter"]) => void;
	onSelect: (itemId: string) => void;
	onLoadMore: () => void;
};

export function ItemsListPanel({
	filter,
	items,
	activeItemId,
	isInitialLoading,
	isFetchingNextPage,
	hasNextPage,
	onFilterChange,
	onSelect,
	onLoadMore,
}: Props) {
	return (
		<div className="flex h-full flex-1 flex-col">
			<PanelHeader>
				<StatusSwitcher value={filter} onValueChange={onFilterChange} />
			</PanelHeader>

			<main className="no-scrollbar scroll-fade-y flex flex-1 flex-col overflow-y-auto">
				<div className="flex flex-col gap-1 p-2">
					{isInitialLoading
						? Array.from({ length: 8 }).map((_, i) => <FeedItemRowSkeleton key={i} />)
						: items.map((item) => (
								<FeedItemRow
									key={item.id}
									item={item}
									isActive={activeItemId === item.id}
									onClick={() => onSelect(item.id)}
								/>
							))}

					{isFetchingNextPage &&
						Array.from({ length: 3 }).map((_, i) => <FeedItemRowSkeleton key={`next-${i}`} />)}

					<InfiniteScrollSentinel enabled={hasNextPage && !isFetchingNextPage} onReach={onLoadMore} />
				</div>
			</main>
		</div>
	);
}
