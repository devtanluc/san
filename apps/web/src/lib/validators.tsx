import { z } from "zod";

export const noteStatusFilterSchema = z
	.enum(["inbox", "archive", "trash", "favorites"])
	.default("inbox");

export const noteSortSchema = z
	.enum([
		"updated_desc",
		"updated_asc",
		"created_desc",
		"created_asc",
		"title_asc",
		"title_desc",
	])
	.default("created_desc");

export const noteFormSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, "Tiêu đề không được để trống")
		.max(200, "Tiêu đề tối đa 200 ký tự"),
	content: z
		.string()
		.trim()
		.max(5000, "Nội dung tối đa 5000 ký tự")
		.default(""),
});

export type NoteFormInput = z.infer<typeof noteFormSchema>;
export type NoteStatusFilter = z.infer<typeof noteStatusFilterSchema>;
export type NoteSort = z.infer<typeof noteSortSchema>;
