import { feed, item } from "@san/db/schema";
import {
	createFeedSchema,
	deleteFeedSchema,
	feedIdSchema,
	feedTitleInputSchema,
	syncFeedSchema,
} from "@san/validation/feed";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import * as z from "zod";
import type { Context } from "../context";
import { protectedProcedure, router } from "../index";
import { FeedSyncError, type FeedSyncErrorCode } from "../lib/safe-fetch";
import { syncFeed } from "../services/feed-sync";

type Db = Context["db"];

const SYNC_COOLDOWN_MS = 60_000;

// Chỉ trả ra những cột client cần (không lộ etag, lastModified, userId)
const publicFeedColumns = {
	id: feed.id,
	type: feed.type,
	url: feed.url,
	title: feed.title,
	iconUrl: feed.iconUrl,
	lastFetchedAt: feed.lastFetchedAt,
	createdAt: feed.createdAt,
};

const updateFeedSchema = z.object({
	id: feedIdSchema,
	title: feedTitleInputSchema,
});

// * Helpers

// Luôn lọc theo userId để user A không đụng được feed của user B.
// Trả NOT_FOUND (không phải FORBIDDEN) để không lộ việc id đó có tồn tại hay không.
async function findOwnedFeed(db: Db, userId: string, id: string) {
	const [row] = await db
		.select()
		.from(feed)
		.where(and(eq(feed.id, id), eq(feed.userId, userId)))
		.limit(1);
	if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Feed not found." });
	return row;
}

const SYNC_ERROR_TO_TRPC: Record<FeedSyncErrorCode, TRPCError["code"]> = {
	BLOCKED_URL: "BAD_REQUEST",
	INVALID_FEED: "UNPROCESSABLE_CONTENT",
	TIMEOUT: "TIMEOUT",
	NETWORK: "BAD_GATEWAY",
	HTTP_ERROR: "BAD_GATEWAY",
	TOO_LARGE: "BAD_GATEWAY",
};

function toTRPCError(e: unknown): TRPCError {
	if (e instanceof FeedSyncError) {
		return new TRPCError({ code: SYNC_ERROR_TO_TRPC[e.code], message: e.message, cause: e });
	}
	return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to sync feed.", cause: e });
}

// * Router

export const feedRouter = router({
	// Danh sách feed của user kèm số bài chưa đọc
	list: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db
			.select({
				...publicFeedColumns,
				unreadCount: sql<number>`count(${item.id}) filter (where ${item.isRead} = false)`.mapWith(Number),
			})
			.from(feed)
			.leftJoin(item, eq(item.feedId, feed.id))
			.where(eq(feed.userId, ctx.session.user.id))
			.groupBy(feed.id)
			.orderBy(desc(feed.createdAt));
	}),

	byId: protectedProcedure.input(z.object({ id: feedIdSchema })).query(async ({ input, ctx }) => {
		const row = await findOwnedFeed(ctx.db, ctx.session.user.id, input.id);
		return {
			id: row.id,
			type: row.type,
			url: row.url,
			title: row.title,
			iconUrl: row.iconUrl,
			lastFetchedAt: row.lastFetchedAt,
			createdAt: row.createdAt,
		};
	}),

	// Tạo feed rồi sync lần đầu ngay. Sync lỗi KHÔNG làm hỏng việc tạo, chỉ trả syncError để UI báo.
	create: protectedProcedure.input(createFeedSchema).mutation(async ({ input, ctx }) => {
		const userId = ctx.session.user.id;

		const { url, title, type } = input;
		if (!url) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid feed url." });

		const [created] = await ctx.db
			.insert(feed)
			.values({ userId, url, title, type })
			.onConflictDoNothing({ target: [feed.userId, feed.url] })
			.returning();

		if (!created) {
			throw new TRPCError({ code: "CONFLICT", message: "You already subscribed to this feed." });
		}

		let inserted = 0;
		let syncError: string | null = null;
		try {
			({ inserted } = await syncFeed(ctx.db, created));
		} catch (e) {
			const err = toTRPCError(e);
			syncError = err.message;
			if (err.code === "INTERNAL_SERVER_ERROR") console.error("[feed.create] initial sync failed", e);
		}

		return {
			feed: { id: created.id, type: created.type, url: created.url, title: created.title },
			inserted,
			syncError,
		};
	}),

	update: protectedProcedure.input(updateFeedSchema).mutation(async ({ input, ctx }) => {
		const [updated] = await ctx.db
			.update(feed)
			.set({ title: input.title })
			.where(and(eq(feed.id, input.id), eq(feed.userId, ctx.session.user.id)))
			.returning(publicFeedColumns);

		if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Feed not found." });
		return updated;
	}),

	// Sync thủ công. Có cooldown để user không spam làm server bị chặn hoặc tốn tài nguyên.
	sync: protectedProcedure.input(syncFeedSchema).mutation(async ({ input, ctx }) => {
		const row = await findOwnedFeed(ctx.db, ctx.session.user.id, input.id);

		if (row.lastFetchedAt && Date.now() - row.lastFetchedAt.getTime() < SYNC_COOLDOWN_MS) {
			return { inserted: 0, notModified: false, skipped: true as const };
		}

		try {
			const result = await syncFeed(ctx.db, row);
			return { ...result, skipped: false as const };
		} catch (e) {
			const err = toTRPCError(e);
			if (err.code === "INTERNAL_SERVER_ERROR") console.error("[feed.sync] failed", e);
			throw err;
		}
	}),

	// Xoá feed -> cascade xoá item -> cascade xoá summary và item_tag
	delete: protectedProcedure.input(deleteFeedSchema).mutation(async ({ input, ctx }) => {
		const [deleted] = await ctx.db
			.delete(feed)
			.where(and(eq(feed.id, input.id), eq(feed.userId, ctx.session.user.id)))
			.returning({ id: feed.id });

		if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Feed not found." });
		return { id: deleted.id };
	}),
});
