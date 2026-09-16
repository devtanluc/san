import { toCompilableQuery } from "@powersync/drizzle-driver";
import { useQuery } from "@powersync/react";
import { useMemo } from "react";
import { getDb, notes } from "@/lib/powersync";
import type { NoteSort, NoteStatusFilter } from "@/lib/validators";
import { getOrderBy, getStatusCondition } from "../queries";

/**
 * Live query: tự re-render khi dữ liệu đổi, dù thay đổi đến từ thao tác local
 * hay từ server sync về.
 */
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
