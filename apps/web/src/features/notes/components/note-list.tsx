import { Skeleton } from "@san/ui/components/skeleton";
import { cn } from "@san/ui/lib/utils";
import { File04 } from "@untitledui/icons";
import type React from "react";
import type { Note } from "../types";
import { NoteItem } from "./note-item";

type Props = {
	notes: Note[];
	isLoading: boolean;
	emptyIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export function NoteList({
	notes,
	isLoading,
	emptyIcon: EmptyIcon = File04,
	className,
	...props
}: Props & React.ComponentProps<"div">) {
	if (isLoading) {
		return (
			<div
				className={cn("flex flex-1 flex-col gap-1 p-2", className)}
				{...props}
			>
				<Skeleton className="h-14" />
				<Skeleton className="h-14" />
				<Skeleton className="h-14" />
			</div>
		);
	}

	if (notes.length === 0) {
		return (
			<div
				className={cn(
					"flex flex-1 flex-col items-center justify-center",
					className,
				)}
				{...props}
			>
				<EmptyIcon strokeWidth={1} className="size-16 text-border" />
			</div>
		);
	}

	return (
		<div className={cn("flex flex-1 flex-col gap-1 p-2", className)} {...props}>
			{notes.map((n) => (
				<NoteItem key={n.id} note={n} />
			))}
		</div>
	);
}
