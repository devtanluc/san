import * as z from "zod";

export const tagIdSchema = z.uuid({ error: "Invalid tag id." });

export const tagNameSchema = z
	.string()
	.trim()
	.min(1, { error: "Tag name cannot be empty." })
	.max(50, { error: "Tag name must be 50 characters or fewer." });

export const createTagSchema = z.object({
	name: tagNameSchema,
});

export const renameTagSchema = z.object({
	id: tagIdSchema,
	name: tagNameSchema,
});

export const deleteTagSchema = z.object({
	id: tagIdSchema,
});

export type CreateTagInput = z.input<typeof createTagSchema>;
export type RenameTagInput = z.input<typeof renameTagSchema>;
export type DeleteTagInput = z.input<typeof deleteTagSchema>;
