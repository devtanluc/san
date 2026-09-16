import { eq } from "drizzle-orm";
import { useCallback, useState } from "react";
import { getDb, notes } from "@/lib/powersync";
import { getOwnerId } from "@/lib/supabase";
import type { Note, NoteStateFields } from "../types";

function nowIso() {
	return new Date().toISOString();
}

/**
 * Các thao tác ghi lên note. Tất cả ghi vào SQLite local -> UI cập nhật ngay,
 * PowerSync lo việc đẩy lên server sau (kể cả khi đang offline).
 */
export function useNoteActions() {
	const db = getDb();
	const [isCreating, setIsCreating] = useState(false);
	const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

	const isPending = useCallback(
		(id: string) => pendingIds.has(id),
		[pendingIds],
	);

	const withPending = useCallback(
		async (id: string, fn: () => Promise<void>) => {
			setPendingIds((prev) => new Set(prev).add(id));
			try {
				await fn();
			} finally {
				setPendingIds((prev) => {
					const next = new Set(prev);
					next.delete(id);
					return next;
				});
			}
		},
		[],
	);

	const setNoteState = useCallback(
		async (id: string, patch: Partial<NoteStateFields>) => {
			await db
				.update(notes)
				.set({ ...patch, updated_at: nowIso() })
				.where(eq(notes.id, id));
		},
		[db],
	);

	const createNote = useCallback(async () => {
		setIsCreating(true);
		try {
			// getOwnerId() đọc session local, không gọi network -> tạo được khi offline.
			const ownerId = await getOwnerId();
			const timestamp = nowIso();
			const id = crypto.randomUUID();

			await db.insert(notes).values({
				id,
				owner_id: ownerId,
				title: "Untitled note",
				content: "",
				created_at: timestamp,
				updated_at: timestamp,
			});

			return id;
		} finally {
			setIsCreating(false);
		}
	}, [db]);

	const updateNote = useCallback(
		(id: string, patch: { title?: string; content?: string }) =>
			withPending(id, async () => {
				await db
					.update(notes)
					.set({ ...patch, updated_at: nowIso() })
					.where(eq(notes.id, id));
			}),
		[db, withPending],
	);

	const togglePin = useCallback(
		(note: Pick<Note, "id" | "pinned_at">) =>
			withPending(note.id, () =>
				setNoteState(note.id, { pinned_at: note.pinned_at ? null : nowIso() }),
			),
		[withPending, setNoteState],
	);

	const toggleArchive = useCallback(
		(note: Pick<Note, "id" | "archived_at">) =>
			withPending(note.id, () => {
				const isArchived = note.archived_at !== null;
				return setNoteState(note.id, {
					archived_at: isArchived ? null : nowIso(),
					// Bật archive thì bỏ pin luôn.
					...(isArchived ? {} : { pinned_at: null }),
				});
			}),
		[withPending, setNoteState],
	);

	const toggleFavorite = useCallback(
		(note: Pick<Note, "id" | "favorited_at">) =>
			withPending(note.id, () =>
				// Favorite độc lập — không đụng tới pin/archive/trash.
				setNoteState(note.id, {
					favorited_at: note.favorited_at ? null : nowIso(),
				}),
			),
		[withPending, setNoteState],
	);

	const toggleTrash = useCallback(
		(note: Pick<Note, "id" | "trashed_at">) =>
			withPending(note.id, () => {
				const isTrashed = note.trashed_at !== null;
				return setNoteState(
					note.id,
					isTrashed
						? // Restore: về thẳng inbox (clear cả archived).
							{ trashed_at: null, archived_at: null }
						: // Trash: bỏ pin luôn.
							{ trashed_at: nowIso(), pinned_at: null },
				);
			}),
		[withPending, setNoteState],
	);

	const deletePermanently = useCallback(
		(id: string) =>
			withPending(id, async () => {
				await db.delete(notes).where(eq(notes.id, id));
			}),
		[withPending, db],
	);

	return {
		createNote,
		isCreating,
		updateNote,
		togglePin,
		toggleArchive,
		toggleFavorite,
		toggleTrash,
		deletePermanently,
		isPending,
	};
}
