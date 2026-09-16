import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@san/ui/components/resizable";
import { createFileRoute } from "@tanstack/react-router";
import { InboxHeader } from "@/components/layouts/inbox/inbox-header";
import { NoteList } from "@/components/notes/note-list";
import { useNoteList } from "@/hooks/use-notes";

export const Route = createFileRoute("/inbox")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: notes = [], isLoading } = useNoteList("inbox");

	return (
		<ResizablePanelGroup orientation="horizontal">
			<ResizablePanel
				defaultSize="35%"
				minSize="30%"
				maxSize="50%"
				className="flex flex-col"
			>
				<InboxHeader />
				<NoteList notes={notes} isLoading={isLoading} />
			</ResizablePanel>

			<ResizableHandle />

			<ResizablePanel defaultSize="65%" className="flex flex-col">
				right
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
