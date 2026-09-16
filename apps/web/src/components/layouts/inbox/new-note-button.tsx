import { Button } from "@san/ui/components/button";
import { Kbd } from "@san/ui/components/Kbd";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@san/ui/components/tooltip";
import { Loading02, Plus } from "@untitledui/icons";
import type React from "react";
import { useNoteActions } from "@/hooks/use-notes";

export function NewNoteButton({
	...props
}: React.ComponentProps<typeof Button>) {
	const { createNote, isCreating } = useNoteActions();

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => createNote()}
						disabled={isCreating}
						{...props}
					>
						{isCreating ? <Loading02 className="animate-spin" /> : <Plus />}
					</Button>
				}
			/>
			<TooltipContent>
				<p>New note</p>
				<Kbd>N</Kbd>
			</TooltipContent>
		</Tooltip>
	);
}
