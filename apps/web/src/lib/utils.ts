import { formatDistanceToNow } from "date-fns";

/** Cột synced ở Powersync có thể null -> không đưa thẳng vào new Date(). */
export function formatDate(value: string | null) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return formatDistanceToNow(date, { addSuffix: true });
}
