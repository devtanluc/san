import { Badge } from "@san/ui/components/badge";
import { Button } from "@san/ui/components/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@san/ui/components/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@san/ui/components/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@san/ui/components/tooltip";
import { ExternalLinkIcon, StarIcon } from "lucide-react";
import { type ComponentProps, useEffect, useRef } from "react";
import { PanelHeader } from "@/components/shared/panel-header";
import {
	type ItemDetail,
	useFetchFullContent,
	useItem,
	useSetItemFavorite,
	useSummarizeItem,
} from "@/features/feed-items/hooks/use-item";
import { ItemArticle } from "./item-article";
import { ItemDetailSkeleton } from "./item-detail-skeleton";
import { ItemSummary } from "./item-summary";
import { ItemsNavigator } from "./items-navigator";

type Props = {
	itemId?: string;
	items: ComponentProps<typeof ItemsNavigator>["items"];
	onClose: () => void;
	onNavigate: (itemId: string) => void;
};

export function ItemDetailPanel({ itemId, items, onClose, onNavigate }: Props) {
	if (!itemId) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground text-sm">
				Select an item to view details
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-0 flex-1 flex-col">
			<PanelHeader>
				<ItemsNavigator items={items} currentItemId={itemId} onClose={onClose} onNavigate={onNavigate} />
				<ItemDetailActions itemId={itemId} />
			</PanelHeader>
			<ItemDetailBody itemId={itemId} />
		</div>
	);
}

function ItemDetailActions({ itemId }: { itemId: string }) {
	const itemQuery = useItem(itemId);
	const favorite = useSetItemFavorite();
	const item = itemQuery.data;

	if (!item) return <div className="ml-auto" />;

	return (
		<TooltipProvider>
			<div className="ml-auto flex items-center gap-1">
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
								aria-pressed={item.isFavorite}
								disabled={favorite.isPending}
								onClick={() => favorite.mutate({ id: item.id, isFavorite: !item.isFavorite })}
							/>
						}
					>
						<StarIcon className={item.isFavorite ? "fill-current" : undefined} />
					</TooltipTrigger>
					<TooltipContent>{item.isFavorite ? "Unfavorite" : "Favorite"}</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Open original article"
								onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
							/>
						}
					>
						<ExternalLinkIcon />
					</TooltipTrigger>
					<TooltipContent>Open original</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}

function ItemDetailBody({ itemId }: { itemId: string }) {
	const itemQuery = useItem(itemId);
	const summarize = useSummarizeItem();
	const fetchFull = useFetchFullContent();

	// Mỗi bài chỉ thử 1 lần mỗi phiên, tránh lặp vô hạn khi trang gốc không trích được
	const triedRef = useRef(new Set<string>());
	const needsFull = itemQuery.data?.needsFullContent;

	useEffect(() => {
		if (!needsFull || triedRef.current.has(itemId)) return;
		triedRef.current.add(itemId);
		fetchFull.mutate({ id: itemId });
	}, [needsFull, itemId, fetchFull.mutate]);

	if (itemQuery.isPending) {
		return (
			<div className="no-scrollbar flex-1 overflow-y-auto">
				<ItemDetailSkeleton />
			</div>
		);
	}

	if (itemQuery.isError || !itemQuery.data) {
		return (
			<Empty className="h-full">
				<EmptyHeader>
					<EmptyTitle>Couldn’t load this item</EmptyTitle>
					<EmptyDescription>{itemQuery.error?.message ?? "Please try again."}</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const item = itemQuery.data;
	const isGenerating = summarize.isPending && summarize.variables?.id === item.id;
	const isLoadingFull = fetchFull.isPending && fetchFull.variables?.id === item.id;

	return (
		<div className="no-scrollbar scroll-fade-y flex min-h-0 flex-1 flex-col overflow-y-auto">
			<article className="flex flex-col gap-6 p-6">
				<ItemDetailHeader item={item} />
				<Tabs defaultValue="article">
					<TabsList variant="line">
						<TabsTrigger value="article">Article</TabsTrigger>
						<TabsTrigger value="summary">Summary</TabsTrigger>
					</TabsList>
					<TabsContent value="article" className="pt-4">
						<ItemArticle item={item} isLoadingFull={isLoadingFull} />
					</TabsContent>
					<TabsContent value="summary" className="pt-4">
						<ItemSummary
							item={item}
							isGenerating={isGenerating}
							onGenerate={(force) => summarize.mutate({ id: item.id, force })}
						/>
					</TabsContent>
				</Tabs>
			</article>
		</div>
	);
}

function ItemDetailHeader({ item }: { item: ItemDetail }) {
	const published = item.publishedAt ?? item.fetchedAt;
	const publishedLabel = published
		? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(published))
		: null;

	return (
		<header className="flex flex-col gap-3">
			<h1 className="font-semibold text-2xl tracking-tight">{item.title}</h1>
			<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
				{item.feedIconUrl ? <img src={item.feedIconUrl} alt="" className="size-4 rounded-sm" /> : null}
				<span>{item.feedTitle}</span>
				{item.author ? (
					<>
						<span aria-hidden="true">·</span>
						<span>{item.author}</span>
					</>
				) : null}
				{publishedLabel ? (
					<>
						<span aria-hidden="true">·</span>
						<time dateTime={new Date(published).toISOString()}>{publishedLabel}</time>
					</>
				) : null}
			</div>
			{item.tags.length > 0 ? (
				<div className="flex flex-wrap gap-1.5">
					{item.tags.map((tag) => (
						<Badge key={tag.id} variant="secondary">
							{tag.name}
						</Badge>
					))}
				</div>
			) : null}
		</header>
	);
}
