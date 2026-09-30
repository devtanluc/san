import { protectedProcedure, publicProcedure, router } from "../index";
import { feedRouter } from "./feed";
import { itemRouter } from "./item";
import { tagRouter } from "./tag";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	feed: feedRouter,
	item: itemRouter,
	tag: tagRouter,
});
export type AppRouter = typeof appRouter;
