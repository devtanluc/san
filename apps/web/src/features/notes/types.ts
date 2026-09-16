import type { NoteRow } from "@/lib/powersync";

/**
 * Kiểu Note dùng trong toàn bộ feature. Component không import thẳng từ
 * lib/powersync/schema nữa — đổi tầng đồng bộ sau này chỉ phải sửa file này.
 *
 * Nhớ: mọi cột synced đều có thể null tại runtime (xem ghi chú trong schema.ts).
 */
export type Note = NoteRow;

export type NoteStateFields = Pick<
	Note,
	"pinned_at" | "archived_at" | "trashed_at" | "favorited_at"
>;
