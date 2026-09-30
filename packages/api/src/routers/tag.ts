import { itemTag, tag } from "@san/db/schema";
import { createTagSchema, deleteTagSchema, renameTagSchema } from "@san/validation";
import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../index";

// Drizzle có thể bọc lỗi driver trong `cause`, nên kiểm tra cả hai tầng
function isUniqueViolation(e: unknown): boolean {
	const code = (x: unknown) => (typeof x === "object" && x !== null ? (x as { code?: unknown }).code : undefined);
	return code(e) === "23505" || code((e as { cause?: unknown } | null)?.cause) === "23505";
}

const duplicate = () => new TRPCError({ code: "CONFLICT", message: "You already have a tag with this name." });
const notFound = () => new TRPCError({ code: "NOT_FOUND", message: "Tag not found." });

export const tagRouter = router({
	// Danh sách tag của user kèm số bài đang gắn tag
	list: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db
			.select({ id: tag.id, name: tag.name, itemCount: count(itemTag.itemId) })
			.from(tag)
			.leftJoin(itemTag, eq(itemTag.tagId, tag.id))
			.where(eq(tag.userId, ctx.session.user.id))
			.groupBy(tag.id)
			.orderBy(tag.name);
	}),

	create: protectedProcedure.input(createTagSchema).mutation(async ({ input, ctx }) => {
		const [created] = await ctx.db
			.insert(tag)
			.values({ userId: ctx.session.user.id, name: input.name })
			.onConflictDoNothing({ target: [tag.userId, tag.name] })
			.returning({ id: tag.id, name: tag.name });

		if (!created) throw duplicate();
		return created;
	}),

	rename: protectedProcedure.input(renameTagSchema).mutation(async ({ input, ctx }) => {
		try {
			const [updated] = await ctx.db
				.update(tag)
				.set({ name: input.name })
				.where(and(eq(tag.id, input.id), eq(tag.userId, ctx.session.user.id)))
				.returning({ id: tag.id, name: tag.name });

			if (!updated) throw notFound();
			return updated;
		} catch (e) {
			if (isUniqueViolation(e)) throw duplicate();
			throw e;
		}
	}),

	// Xoá tag -> cascade xoá các dòng item_tag, không đụng tới item
	delete: protectedProcedure.input(deleteTagSchema).mutation(async ({ input, ctx }) => {
		const [deleted] = await ctx.db
			.delete(tag)
			.where(and(eq(tag.id, input.id), eq(tag.userId, ctx.session.user.id)))
			.returning({ id: tag.id });

		if (!deleted) throw notFound();
		return { id: deleted.id };
	}),
});
