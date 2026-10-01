import * as z from "zod";

import { feedIdSchema } from "./feed";
import { tagIdSchema } from "./tag";

export const itemIdSchema = z.uuid({ error: "Invalid item id." });

// Cursor keyset: (sortAt, id). sortAt là chuỗi ISO có đủ 6 chữ số micro giây, lấy nguyên từ DB.
// Không dùng Date vì JS chỉ có mili giây, cắt bớt sẽ làm trùng hoặc sót bài ở ranh giới trang.
export const itemCursorSchema = z.object({
	sortAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/, { error: "Invalid cursor." }),
	id: itemIdSchema,
});

export const listItemsSchema = z.object({
	feedId: feedIdSchema.optional(),
	tagId: tagIdSchema.optional(),
	filter: z.enum(["all", "unread", "favorite"]).default("all"),
	// nullish để dùng thẳng với useInfiniteQuery của tRPC
	cursor: itemCursorSchema.nullish(),
	limit: z.number().int().min(1).max(50).default(20),
});

export const getItemSchema = z.object({
	id: itemIdSchema,
});

export const summarizeItemSchema = z.object({
	id: itemIdSchema,
	force: z.boolean().optional(),
});

export const setItemReadSchema = z.object({
	id: itemIdSchema,
	isRead: z.boolean(),
});

export const setItemFavoriteSchema = z.object({
	id: itemIdSchema,
	isFavorite: z.boolean(),
});

// Bỏ feedId = đánh dấu đã đọc toàn bộ bài của user
export const markAllReadSchema = z.object({
	feedId: feedIdSchema.optional(),
});

// Thay toàn bộ tag của item bằng danh sách mới (rỗng = gỡ hết tag)
export const setItemTagsSchema = z.object({
	itemId: itemIdSchema,
	tagIds: z
		.array(tagIdSchema)
		.max(20, { error: "An item can have at most 20 tags." })
		.transform((ids) => [...new Set(ids)]),
});

export const itemByIdSchema = z.object({ id: z.uuid() });

export const updateItemSchema = z
	.object({
		id: z.uuid(),
		isRead: z.boolean().optional(),
		isFavorite: z.boolean().optional(),
	})
	.refine((v) => v.isRead !== undefined || v.isFavorite !== undefined, "Nothing to update");

export type ListItemsInput = z.input<typeof listItemsSchema>;
export type ItemCursor = z.output<typeof itemCursorSchema>;
export type SetItemReadInput = z.input<typeof setItemReadSchema>;
export type SetItemFavoriteInput = z.input<typeof setItemFavoriteSchema>;
export type MarkAllReadInput = z.input<typeof markAllReadSchema>;
export type SetItemTagsInput = z.input<typeof setItemTagsSchema>;
export type SummarizeItemInput = z.input<typeof summarizeItemSchema>;
