import { and, asc, desc, isNotNull, isNull, type SQL, sql } from "drizzle-orm";
import { notes } from "@/lib/powersync";
import type { NoteSort, NoteStatusFilter } from "@/lib/validators";

export function getStatusCondition(status: NoteStatusFilter) {
	switch (status) {
		case "trash":
			return isNotNull(notes.trashed_at);
		case "archive":
			return and(isNull(notes.trashed_at), isNotNull(notes.archived_at));
		case "favorites":
			return and(isNull(notes.trashed_at), isNotNull(notes.favorited_at));
		case "inbox":
			return and(isNull(notes.trashed_at), isNull(notes.archived_at));
	}
}

export function getOrderBy(sort: NoteSort, status: NoteStatusFilter): SQL[] {
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

	// Mặc định đẩy note đã pin lên đầu, trừ khi đang xem trash.
	return status === "trash"
		? [primary]
		: [pinnedFirst, desc(notes.pinned_at), primary];
}
