import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@san/ui/components/resizable";
import { type ListItemsInput, listItemsSchema } from "@san/validation";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { FeedItemRow } from "@/components/feed-items/feed-item-row";
import { StatusSwitcher } from "@/components/feed-items/status-switcher";
import { useItems } from "@/hooks/use-items";

const DEFAULT_SEARCH: ListItemsInput = {
	filter: "all",
	limit: 20,
};

export const Route = createFileRoute("/_auth/home/")({
	validateSearch: listItemsSchema,
	search: {
		middlewares: [stripSearchParams(DEFAULT_SEARCH)],
	},
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const { ref, inView } = useInView({
		rootMargin: "400px 0px",
	});

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useItems(search);

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	const items = data?.pages.flatMap((page) => page.items) ?? [];

	return (
		<ResizablePanelGroup orientation="horizontal">
			<ResizablePanel minSize="30%">
				<div className="flex h-dvh flex-1 flex-col">
					<header className="flex h-(--header-height) items-center gap-2 border-b p-2">
						<StatusSwitcher
							value={search.filter}
							onValueChange={(filter) => {
								navigate({
									search: (prev) => ({
										...prev,
										filter,
									}),
									replace: true,
								});
							}}
						/>
					</header>

					<main className="scrollbar-thin scroll-fade-b flex flex-1 flex-col overflow-y-auto">
						<div className="flex flex-col p-2">
							{items.map((item) => (
								<FeedItemRow key={item.id} item={item} />
							))}

							<div ref={ref} className="h-10" aria-hidden="true">
								{isFetchingNextPage && "Loading..."}
							</div>
						</div>
					</main>
				</div>
			</ResizablePanel>

			<ResizableHandle />

			<ResizablePanel minSize="55%">Two</ResizablePanel>
		</ResizablePanelGroup>
	);
}
