import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@san/ui/components/resizable";
import { type ListItemsInput, listItemsSchema } from "@san/validation";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import z from "zod";
import { ItemDetailPanel, ItemsListPanel, useFlatItems } from "@/features/feed-items";

const DEFAULT_SEARCH: ListItemsInput = { filter: "all", limit: 20 };

const homeSearchSchema = listItemsSchema.extend({
	itemId: z.uuid().optional(),
});

export const Route = createFileRoute("/_auth/home/")({
	validateSearch: homeSearchSchema,
	search: { middlewares: [stripSearchParams(DEFAULT_SEARCH)] },
	component: RouteComponent,
});

function RouteComponent() {
	const { itemId, ...itemsSearch } = Route.useSearch();
	const navigate = Route.useNavigate();
	const list = useFlatItems(itemsSearch);

	const setItemId = (id: string | undefined, replace = false) =>
		navigate({ search: (prev) => ({ ...prev, itemId: id }), replace });

	return (
		<ResizablePanelGroup orientation="horizontal">
			<ResizablePanel minSize="35%">
				<ItemsListPanel
					filter={itemsSearch.filter}
					items={list.items}
					activeItemId={itemId}
					isInitialLoading={list.isInitialLoading}
					isFetchingNextPage={list.isFetchingNextPage}
					hasNextPage={list.hasNextPage}
					onLoadMore={() => list.fetchNextPage()}
					onSelect={(id) => setItemId(id)}
					onFilterChange={(filter) =>
						navigate({
							search: (prev) => ({ ...prev, filter, itemId: undefined }),
							replace: true,
						})
					}
				/>
			</ResizablePanel>

			<ResizableHandle />

			<ResizablePanel minSize="55%">
				<ItemDetailPanel
					itemId={itemId}
					items={list.items}
					onClose={() => setItemId(undefined, true)}
					onNavigate={(id) => setItemId(id)}
				/>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
