import { Button } from "@san/ui/components/button";
import { cn } from "@san/ui/lib/utils";
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react";
import type React from "react";

type ItemsNavigatorProps = React.ComponentProps<"div"> & {
	items: Array<{ id: string }>;
	currentItemId?: string;
	onClose: () => void;
	onNavigate: (itemId: string) => void;
};

export function ItemsNavigator({
	items,
	currentItemId,
	onClose,
	onNavigate,
	className,
	...props
}: ItemsNavigatorProps) {
	const currentIndex = items.findIndex((item) => item.id === currentItemId);

	const canGoPrevious = currentIndex > 0;

	const canGoNext = currentIndex >= 0 && currentIndex < items.length - 1;

	return (
		<div className={cn("flex items-center", className)} {...props}>
			<Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
				<XIcon />
			</Button>

			<Button
				variant="ghost"
				size="icon-sm"
				disabled={!canGoPrevious}
				onClick={() => {
					if (!canGoPrevious) {
						return;
					}

					onNavigate(items[currentIndex - 1].id);
				}}
				aria-label="Previous item"
			>
				<ChevronUpIcon />
			</Button>

			<Button
				variant="ghost"
				size="icon-sm"
				disabled={!canGoNext}
				onClick={() => {
					if (!canGoNext) {
						return;
					}

					onNavigate(items[currentIndex + 1].id);
				}}
				aria-label="Next item"
			>
				<ChevronDownIcon />
			</Button>
		</div>
	);
}
