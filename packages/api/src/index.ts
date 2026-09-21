import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create({
	transformer: superjson,
});

export const router = t.router;

/** Không cần login - Dùng cho Feed, Profile, Post Detail bản khách */
export const publicProcedure = t.procedure;

//** Bắt buộc login - React, Follow, Reply, Write, mọi thứ trong (app) */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

/** Chặn user chưa xong onboarding */
export const onboardedProcedure = protectedProcedure.use(({ ctx, next }) => {
	if (!ctx.session.user.onboardingCompletedAt)
		throw new TRPCError({
			code: "PRECONDITION_FAILED",
			message: "ONBOARDING_REQUIRED",
		});
	return next();
});
