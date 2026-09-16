import { cn } from "@san/ui/lib/utils";
import type React from "react";
import { InboxStatusSwitcher } from "./inbox-status-switcher";
import { NewNoteButton } from "./new-note-button";
import { NoteSortDropdown } from "./note-sort-button";

export function InboxHeader({
	className,
	...props
}: React.ComponentProps<"header">) {
	return (
		<header
			className={cn(
				"flex h-(--header-height) items-center gap-2 border-b p-2",
				className,
			)}
			{...props}
		>
			<InboxStatusSwitcher />

			<div className="ml-auto flex items-center">
				<NoteSortDropdown />
				<NewNoteButton />
			</div>
		</header>
	);
}
