import { Button } from "@san/ui/components/button";
import { Item, ItemActions, ItemContent, ItemTitle } from "@san/ui/components/item";
import { cn } from "@san/ui/lib/utils";
import { MoreHorizontalIcon } from "lucide-react";
import type React from "react";
import type { FeedItem } from "@/features/feed-items/hooks/use-items";

interface FeedItemRowProps {
	item: FeedItem;
	isActive?: boolean;
}

export function FeedItemRow({
	item,
	isActive,
	className,
	...props
}: FeedItemRowProps & React.ComponentProps<typeof Item>) {
	return (
		<Item
			size="sm"
			className={cn(
				"cursor-default py-1 pr-1 ring-1 ring-transparent transition-none hover:bg-input/30 hover:ring-foreground/10",
				isActive && "bg-input/50 ring-foreground/10",
				className,
			)}
			{...props}
		>
			<ItemContent className="min-w-0">
				<ItemTitle className="line-clamp-1">{item.title}</ItemTitle>
			</ItemContent>
			<ItemActions>
				<Button variant="ghost-action" size="icon-sm">
					<MoreHorizontalIcon />
				</Button>
			</ItemActions>
		</Item>
	);
}
