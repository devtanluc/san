import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@san/ui/components/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@san/ui/components/dropdown-menu";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	useSidebar,
} from "@san/ui/components/sidebar";
import { Spinner } from "@san/ui/components/spinner";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { ChevronRightIcon, MoreHorizontalIcon, NewspaperIcon, RefreshCcwIcon, TrashIcon } from "lucide-react";
import { useDeleteFeed, useFeeds, useSyncFeed, useSyncingFeedIds } from "@/hooks/use-feeds";

export function NavFeeds() {
	const navigate = useNavigate();
	const location = useLocation();
	const { isMobile } = useSidebar();
	const { data: feeds = [], isLoading } = useFeeds();

	const { mutate: syncFeed } = useSyncFeed();
	const { mutate: deleteFeed, isPending: isDeleting } = useDeleteFeed();
	const syncingIds = useSyncingFeedIds();

	const currentFeedId = location.search.feedId;

	function handleSelectFeed(id: string) {
		// Nếu feed đang được chọn thì hủy chọn
		if (currentFeedId === id) {
			return navigate({ to: "/home" });
		}

		return navigate({ to: "/home", search: { feedId: id } });
	}

	function handleSyncFeed(id: string) {
		syncFeed({ id });
	}

	function handleDeleteFeed(id: string) {
		deleteFeed({ id });
	}

	return (
		<Collapsible defaultOpen className="group/collapsible">
			<SidebarGroup>
				<SidebarGroupLabel
					className="hover:bg-muted hover:text-foreground"
					render={
						<CollapsibleTrigger>
							<span>Feeds</span>
							<ChevronRightIcon className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
						</CollapsibleTrigger>
					}
				/>

				<CollapsibleContent className="pb-2">
					<SidebarGroupContent>
						<SidebarMenu>
							{isLoading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<SidebarMenuItem key={i}>
										<SidebarMenuSkeleton />
									</SidebarMenuItem>
								))
							) : feeds.length === 0 ? (
								<div className="px-2 py-1.5 text-muted-foreground text-sm">No feeds yet.</div>
							) : (
								feeds.map((f) => {
									const isActive = currentFeedId === f.id;
									const isSyncingThis = syncingIds.includes(f.id);

									return (
										<SidebarMenuItem key={f.id}>
											<SidebarMenuButton
												isActive={isActive}
												onClick={() => handleSelectFeed(f.id)}
											>
												{isSyncingThis ? <Spinner /> : <NewspaperIcon />}
												<span>{f.title}</span>
											</SidebarMenuButton>
											<DropdownMenu>
												<DropdownMenuTrigger
													render={
														<SidebarMenuAction showOnHover>
															<MoreHorizontalIcon />
															<span className="sr-only">More</span>
														</SidebarMenuAction>
													}
												/>
												<DropdownMenuContent
													className="w-56 rounded-lg"
													side={isMobile ? "bottom" : "right"}
													align={isMobile ? "end" : "start"}
												>
													<DropdownMenuItem
														disabled={isSyncingThis}
														onClick={() => handleSyncFeed(f.id)}
													>
														<RefreshCcwIcon className="text-muted-foreground" />
														<span>Sync</span>
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														variant="destructive"
														disabled={isDeleting}
														onClick={() => handleDeleteFeed(f.id)}
													>
														<TrashIcon className="text-muted-foreground" />
														<span>Delete</span>
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</SidebarMenuItem>
									);
								})
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</CollapsibleContent>
			</SidebarGroup>
		</Collapsible>
	);
}
