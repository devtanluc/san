import { toCompilableQuery } from "@powersync/drizzle-driver";
import { useQuery } from "@powersync/react";
import { Button } from "@san/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { useMemo, useState } from "react";
import { getDb } from "@/lib/powersync/database";
import { notes } from "@/lib/powersync/schema";
import { getOwnerId } from "@/lib/supabase";

export const Route = createFileRoute("/notes")({
	component: NotesPage,
});

function NotesPage() {
	const db = getDb();

	// Live query: tự động re-render khi data thay đổi (local hoặc sync từ server về)
	const notesQuery = useMemo(
		() =>
			toCompilableQuery(
				db.select().from(notes).orderBy(desc(notes.updated_at)),
			),
		[db],
	);
	const { data: noteList, isLoading } = useQuery(notesQuery);

	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);

	async function handleAdd() {
		if (!title.trim()) return;
		const ownerId = await getOwnerId();
		const now = new Date().toISOString();

		await db.insert(notes).values({
			id: crypto.randomUUID(),
			owner_id: ownerId,
			title: title.trim(),
			content: content.trim(),
			created_at: now,
			updated_at: now,
		});

		setTitle("");
		setContent("");
	}

	async function handleUpdate(id: string) {
		await db
			.update(notes)
			.set({
				title: title.trim(),
				content: content.trim(),
				updated_at: new Date().toISOString(),
			})
			.where(eq(notes.id, id));

		setEditingId(null);
		setTitle("");
		setContent("");
	}

	async function handleDelete(id: string) {
		await db.delete(notes).where(eq(notes.id, id));
	}

	function startEdit(note: (typeof noteList)[number]) {
		setEditingId(note.id);
		setTitle(note.title ?? "");
		setContent(note.content ?? "");
	}

	function cancelEdit() {
		setEditingId(null);
		setTitle("");
		setContent("");
	}

	return (
		<div className="mx-auto max-w-2xl p-6">
			<h1 className="mb-4 font-semibold text-2xl">Ghi chú</h1>

			{/* Form thêm/sửa */}
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
							<Button onClick={cancelEdit}>Huỷ</Button>
						</>
					) : (
						<Button onClick={handleAdd}>Thêm ghi chú</Button>
					)}
				</div>
			</div>

			{/* Danh sách */}
			{isLoading && (
				<p className="text-muted-foreground text-sm">Đang tải...</p>
			)}

			<div className="space-y-3">
				{noteList?.map((note) => (
					<div key={note.id} className="rounded-lg border p-4">
						<div className="flex items-start justify-between gap-2">
							<div>
								<h3 className="font-medium">{note.title}</h3>
								<p className="mt-1 whitespace-pre-wrap text-muted-foreground text-sm">
									{note.content}
								</p>
							</div>
							<div className="flex shrink-0 gap-2">
								<Button onClick={() => startEdit(note)}>Sửa</Button>
								<Button
									variant="destructive"
									onClick={() => handleDelete(note.id)}
								>
									Xoá
								</Button>
							</div>
						</div>
					</div>
				))}

				{!isLoading && noteList?.length === 0 && (
					<p className="text-muted-foreground text-sm">Chưa có ghi chú nào.</p>
				)}
			</div>
		</div>
	);
}
