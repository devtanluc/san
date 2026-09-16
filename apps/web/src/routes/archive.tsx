import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@san/ui/components/resizable";
import { createFileRoute } from "@tanstack/react-router";
import { Archive } from "@untitledui/icons";
import { InboxHeader } from "@/components/layouts/inbox/inbox-header";
import { NoteList, useNoteList } from "@/features/notes";

export const Route = createFileRoute("/archive")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: notes = [], isLoading } = useNoteList("archive");

	return (
		<ResizablePanelGroup orientation="horizontal">
			<ResizablePanel
				defaultSize="35%"
				minSize="30%"
				maxSize="50%"
				className="flex flex-col"
			>
				<InboxHeader />
				<NoteList notes={notes} isLoading={isLoading} emptyIcon={Archive} />
			</ResizablePanel>

			<ResizableHandle />

			<ResizablePanel defaultSize="65%" className="flex flex-col">
				right
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
