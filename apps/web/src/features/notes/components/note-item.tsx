import { Button } from "@san/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@san/ui/components/dropdown-menu";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@san/ui/components/item";
import { cn } from "@san/ui/lib/utils";
import {
	Archive,
	DotsHorizontal,
	Loading02,
	Pin01,
	Pin02,
	RefreshCcw05,
	Star01,
	Trash01,
	Trash04,
} from "@untitledui/icons";
import type React from "react";
import { formatDate } from "@/lib/utils";
import { useNoteActions } from "../hooks/use-note-actions";
import type { Note } from "../types";

export function NoteItem({
	note,
	className,
	...props
}: { note: Note } & React.ComponentProps<typeof Item>) {
	const {
		togglePin,
		toggleArchive,
		toggleFavorite,
		toggleTrash,
		deletePermanently,
		isPending,
	} = useNoteActions();

	const pending = isPending(note.id);
	const isPinned = note.pinned_at !== null;
	const isArchived = note.archived_at !== null;
	const isFavorited = note.favorited_at !== null;
	const isTrashed = note.trashed_at !== null;

	const formattedUpdatedAt = formatDate(note.updated_at);
	const showOrganizeActions = !isTrashed;

	return (
		<Item
			size="xs"
			className={cn("cursor-default hover:bg-muted", className)}
			{...props}
		>
			<ItemContent className="min-w-0">
				<ItemTitle>
					{isPinned && (
						<Pin02 className="size-3.5 shrink-0 -translate-y-px fill-current text-foreground/80" />
					)}
					<span>{note.title || "Untitled note"}</span>
				</ItemTitle>
				<ItemDescription>{formattedUpdatedAt}</ItemDescription>
			</ItemContent>

			<ItemActions className="ml-auto flex items-center">
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								disabled={pending}
								onClick={(e) => e.stopPropagation()}
							>
								{pending ? (
									<Loading02 className="animate-spin" />
								) : (
									<DotsHorizontal />
								)}
							</Button>
						}
					/>
					<DropdownMenuContent align="end" className="min-w-50">
						{showOrganizeActions && (
							<>
								<DropdownMenuItem
									disabled={pending}
									onClick={() => togglePin(note)}
								>
									{isPinned ? <Pin01 /> : <Pin02 />}
									<span>{isPinned ? "Unpin" : "Pin"}</span>
								</DropdownMenuItem>

								<DropdownMenuItem
									disabled={pending}
									onClick={() => toggleFavorite(note)}
								>
									<Star01 />
									<span>
										{isFavorited ? "Remove from favorites" : "Add to favorites"}
									</span>
								</DropdownMenuItem>

								<DropdownMenuItem
									disabled={pending}
									onClick={() => toggleArchive(note)}
								>
									<Archive />
									<span>{isArchived ? "Unarchive" : "Archive"}</span>
								</DropdownMenuItem>

								<DropdownMenuSeparator />
							</>
						)}

						{isTrashed ? (
							<>
								<DropdownMenuItem
									disabled={pending}
									onClick={() => toggleTrash(note)}
								>
									<RefreshCcw05 />
									<span>Restore</span>
								</DropdownMenuItem>

								<DropdownMenuItem
									variant="destructive"
									disabled={pending}
									onClick={() => deletePermanently(note.id)}
								>
									<Trash04 />
									<span>Delete permanently</span>
								</DropdownMenuItem>
							</>
						) : (
							<DropdownMenuItem
								variant="destructive"
								disabled={pending}
								onClick={() => toggleTrash(note)}
							>
								<Trash01 />
								<span>Move to trash</span>
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</ItemActions>
		</Item>
	);
}
