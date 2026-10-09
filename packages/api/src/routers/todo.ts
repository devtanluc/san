import { todo } from "@san/db/schema/todo";
import { asc, eq } from "drizzle-orm";
import z from "zod";

import { publicProcedure, router } from "../index";

export const todoRouter = router({
	getAll: publicProcedure.query(async ({ ctx }) => {
		return await ctx.db.select().from(todo).orderBy(asc(todo.createdAt));
	}),

	create: publicProcedure
		.input(z.object({ id: z.uuid(), text: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			const [row] = await ctx.db.insert(todo).values(input).returning();
			return row;
		}),

	update: publicProcedure
		.input(
			z.object({
				id: z.uuid(),
				text: z.string().min(1).optional(),
				completed: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input: { id, ...changes } }) => {
			const [row] = await ctx.db
				.update(todo)
				.set(changes)
				.where(eq(todo.id, id))
				.returning();
			return row;
		}),

	delete: publicProcedure
		.input(z.object({ id: z.uuid() }))
		.mutation(async ({ input, ctx }) => {
			await ctx.db.delete(todo).where(eq(todo.id, input.id));
			return { id: input.id };
		}),
});
