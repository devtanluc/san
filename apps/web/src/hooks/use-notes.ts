import { toCompilableQuery } from "@powersync/drizzle-driver";
import { useQuery } from "@powersync/react";
import {
	and,
	asc,
	desc,
	eq,
	isNotNull,
	isNull,
	type SQL,
	sql,
} from "drizzle-orm";
import { useCallback, useMemo, useState } from "react";
import { getDb } from "@/lib/powersync/database";
import { notes } from "@/lib/powersync/schema";
import { getOwnerId } from "@/lib/supabase";
import type { NoteSort, NoteStatusFilter } from "@/lib/validators";

type NoteRow = typeof notes.$inferSelect;

function nowIso() {
	return new Date().toISOString();
}

function getStatusCondition(status: NoteStatusFilter) {
	switch (status) {
		case "trash":
			return isNotNull(notes.trashed_at);
		case "archive":
			return and(isNull(notes.trashed_at), isNotNull(notes.archived_at));
		case "inbox":
			return and(isNull(notes.trashed_at), isNull(notes.archived_at));
	}
}

export function getOrderBy(sort: NoteSort, status: NoteStatusFilter) {
	const pinnedFirst = sql`${notes.pinned_at} IS NULL`;

	const sortMap: Record<NoteSort, SQL> = {
		updated_desc: desc(notes.updated_at),
		updated_asc: asc(notes.updated_at),
		created_desc: desc(notes.created_at),
		created_asc: asc(notes.created_at),
		title_asc: asc(notes.title),
		title_desc: desc(notes.title),
	};

	const primary = sortMap[sort];

	// Mặc định sort pinned lên đầu, trừ khi đang xem trash
	return status === "trash"
		? [primary]
		: [pinnedFirst, desc(notes.pinned_at), primary];
}

export function useNoteList(
	status: NoteStatusFilter = "inbox",
	sort: NoteSort = "created_desc",
) {
	const db = getDb();

	const notesQuery = useMemo(
		() =>
			toCompilableQuery(
				db
					.select()
					.from(notes)
					.where(getStatusCondition(status))
					.orderBy(...getOrderBy(sort, status)),
			),
		[db, status, sort],
	);

	return useQuery(notesQuery);
}

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
		async (
			id: string,
			patch: Partial<Pick<NoteRow, "pinned_at" | "archived_at" | "trashed_at">>,
		) => {
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

	const togglePin = useCallback(
		(note: Pick<NoteRow, "id" | "pinned_at">) =>
			withPending(note.id, () =>
				setNoteState(note.id, { pinned_at: note.pinned_at ? null : nowIso() }),
			),
		[withPending, setNoteState],
	);

	const toggleArchive = useCallback(
		(note: Pick<NoteRow, "id" | "archived_at">) =>
			withPending(note.id, () => {
				const isArchived = note.archived_at !== null;
				return setNoteState(note.id, {
					archived_at: isArchived ? null : nowIso(),
					// bật archive thì tự bỏ pin, giống logic cũ
					...(isArchived ? {} : { pinned_at: null }),
				});
			}),
		[withPending, setNoteState],
	);

	const toggleTrash = useCallback(
		(note: Pick<NoteRow, "id" | "trashed_at">) =>
			withPending(note.id, () => {
				const isTrashed = note.trashed_at !== null;
				return setNoteState(
					note.id,
					// restore: về thẳng inbox (clear cả archived)
					// trash: bỏ pin luôn
					isTrashed
						? { trashed_at: null, archived_at: null }
						: { trashed_at: nowIso(), pinned_at: null },
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
		togglePin,
		toggleArchive,
		toggleTrash,
		deletePermanently,
		isPending,
	};
}
