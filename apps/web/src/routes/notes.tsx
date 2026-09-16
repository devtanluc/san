import { Button } from "@san/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { type Note, useNoteActions, useNoteList } from "@/features/notes";

export const Route = createFileRoute("/notes")({
	component: NotesPage,
});

function NotesPage() {
	// Route không còn chạm vào getDb()/bảng notes nữa — tất cả đi qua feature layer.
	const { data: noteList = [], isLoading } = useNoteList("inbox", "updated_desc");
	const { createNote, updateNote, deletePermanently, isCreating } =
		useNoteActions();

	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);

	function resetForm() {
		setEditingId(null);
		setTitle("");
		setContent("");
	}

	async function handleAdd() {
		if (!title.trim()) return;
		const id = await createNote();
		await updateNote(id, { title: title.trim(), content: content.trim() });
		resetForm();
	}

	async function handleUpdate(id: string) {
		await updateNote(id, { title: title.trim(), content: content.trim() });
		resetForm();
	}

	function startEdit(note: Note) {
		setEditingId(note.id);
		setTitle(note.title ?? "");
		setContent(note.content ?? "");
	}

	return (
		<div className="mx-auto max-w-2xl p-6">
			<h1 className="mb-4 font-semibold text-2xl">Ghi chú</h1>

			<div className="mb-6 space-y-2 rounded-lg border p-4">
				<input
					className="w-full rounded border px-3 py-2 text-sm"
					placeholder="Tiêu đề"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>
				<textarea
					className="w-full rounded border px-3 py-2 text-sm"
					placeholder="Nội dung"
					rows={3}
					value={content}
					onChange={(e) => setContent(e.target.value)}
				/>
				<div className="flex gap-2">
					{editingId ? (
						<>
							<Button onClick={() => handleUpdate(editingId)}>Lưu</Button>
							<Button variant="outline" onClick={resetForm}>
								Huỷ
							</Button>
						</>
					) : (
						<Button onClick={handleAdd} disabled={isCreating || !title.trim()}>
							Thêm ghi chú
						</Button>
					)}
				</div>
			</div>

			{isLoading && (
				<p className="text-muted-foreground text-sm">Đang tải...</p>
			)}

			<div className="space-y-3">
				{noteList.map((note) => (
					<div key={note.id} className="rounded-lg border p-4">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0">
								<h3 className="font-medium">{note.title || "Untitled note"}</h3>
								<p className="mt-1 whitespace-pre-wrap text-muted-foreground text-sm">
									{note.content}
								</p>
							</div>
							<div className="flex shrink-0 gap-2">
								<Button variant="outline" onClick={() => startEdit(note)}>
									Sửa
								</Button>
								<Button
									variant="destructive"
									onClick={() => deletePermanently(note.id)}
								>
									Xoá
								</Button>
							</div>
						</div>
					</div>
				))}

				{!isLoading && noteList.length === 0 && (
					<p className="text-muted-foreground text-sm">Chưa có ghi chú nào.</p>
				)}
			</div>
		</div>
	);
}
