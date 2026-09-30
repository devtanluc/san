import { feed, item, itemTag, summary, tag } from "@san/db/schema";
import {
	getItemSchema,
	listItemsSchema,
	markAllReadSchema,
	setItemFavoriteSchema,
	setItemReadSchema,
	setItemTagsSchema,
} from "@san/validation";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, exists, inArray, sql } from "drizzle-orm";
import type { Context } from "../context";
import { protectedProcedure, router } from "../index";

type Db = Context["db"];
// Cho phép truyền cả db lẫn transaction
type Executor = Pick<Db, "select">;

// * Helpers

// item không có userId, quyền sở hữu đi qua feed: item -> feed -> user.
// Mọi query/mutation đều phải lọc qua đây để user A không đụng được bài của user B.
const ownedFeedIds = (db: Executor, userId: string) =>
	db.select({ id: feed.id }).from(feed).where(eq(feed.userId, userId));

// Mốc sắp xếp timeline: published_at có thể null nên fallback về fetched_at
const sortAt = sql`coalesce(${item.publishedAt}, ${item.fetchedAt})`;
// Bản text có đủ micro giây, dùng làm cursor (xem itemCursorSchema)
const sortAtText = sql<string>`to_char(${sortAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

const notFound = () => new TRPCError({ code: "NOT_FOUND", message: "Item not found." });

// * Router

export const itemRouter = router({
	// Timeline có phân trang cursor (keyset), ổn định kể cả khi có bài mới chèn vào giữa chừng
	list: protectedProcedure.input(listItemsSchema).query(async ({ input, ctx }) => {
		const userId = ctx.session.user.id;

		const conditions = [eq(feed.userId, userId)];
		if (input.feedId) conditions.push(eq(item.feedId, input.feedId));
		if (input.filter === "unread") conditions.push(eq(item.isRead, false));
		if (input.filter === "favorite") conditions.push(eq(item.isFavorite, true));
		if (input.tagId) {
			conditions.push(
				exists(
					ctx.db
						.select({ one: sql`1` })
						.from(itemTag)
						.where(and(eq(itemTag.itemId, item.id), eq(itemTag.tagId, input.tagId))),
				),
			);
		}
		if (input.cursor) {
			conditions.push(
				sql`(${sortAt}, ${item.id}) < (${input.cursor.sortAt}::timestamptz, ${input.cursor.id}::uuid)`,
			);
		}

		// Lấy dư 1 dòng để biết còn trang sau hay không
		const rows = await ctx.db
			.select({
				id: item.id,
				feedId: item.feedId,
				feedTitle: feed.title,
				feedIconUrl: feed.iconUrl,
				title: item.title,
				url: item.url,
				publishedAt: item.publishedAt,
				fetchedAt: item.fetchedAt,
				isRead: item.isRead,
				isFavorite: item.isFavorite,
				hasSummary: sql<boolean>`${summary.id} is not null`,
				sortAt: sortAtText,
			})
			.from(item)
			.innerJoin(feed, eq(feed.id, item.feedId))
			.leftJoin(summary, eq(summary.itemId, item.id))
			.where(and(...conditions))
			.orderBy(desc(sortAt), desc(item.id))
			.limit(input.limit + 1);

		const hasMore = rows.length > input.limit;
		const page = hasMore ? rows.slice(0, input.limit) : rows;
		const last = page.at(-1);

		return {
			items: page.map(({ sortAt: _sortAt, ...rest }) => rest),
			nextCursor: hasMore && last ? { sortAt: last.sortAt, id: last.id } : null,
		};
	}),

	// Chi tiết 1 bài. Chỉ trả contentClean, không bao giờ trả contentRaw (HTML chưa làm sạch, có thể chứa XSS).
	// Query này không tự đánh dấu đã đọc, client gọi setRead khi cần.
	byId: protectedProcedure.input(getItemSchema).query(async ({ input, ctx }) => {
		const userId = ctx.session.user.id;

		const [row] = await ctx.db
			.select({
				id: item.id,
				feedId: item.feedId,
				feedTitle: feed.title,
				feedIconUrl: feed.iconUrl,
				title: item.title,
				url: item.url,
				contentClean: item.contentClean,
				publishedAt: item.publishedAt,
				fetchedAt: item.fetchedAt,
				isRead: item.isRead,
				isFavorite: item.isFavorite,
				summaryText: summary.summaryText,
				summaryModel: summary.model,
				summaryGeneratedAt: summary.generatedAt,
			})
			.from(item)
			.innerJoin(feed, eq(feed.id, item.feedId))
			.leftJoin(summary, eq(summary.itemId, item.id))
			.where(and(eq(item.id, input.id), eq(feed.userId, userId)))
			.limit(1);

		if (!row) throw notFound();

		const tags = await ctx.db
			.select({ id: tag.id, name: tag.name })
			.from(itemTag)
			.innerJoin(tag, eq(tag.id, itemTag.tagId))
			.where(and(eq(itemTag.itemId, row.id), eq(tag.userId, userId)))
			.orderBy(tag.name);

		return {
			id: row.id,
			feedId: row.feedId,
			feedTitle: row.feedTitle,
			feedIconUrl: row.feedIconUrl,
			title: row.title,
			url: row.url,
			contentClean: row.contentClean,
			publishedAt: row.publishedAt,
			fetchedAt: row.fetchedAt,
			isRead: row.isRead,
			isFavorite: row.isFavorite,
			summary: row.summaryText
				? { text: row.summaryText, model: row.summaryModel, generatedAt: row.summaryGeneratedAt }
				: null,
			tags,
		};
	}),

	setRead: protectedProcedure.input(setItemReadSchema).mutation(async ({ input, ctx }) => {
		const [updated] = await ctx.db
			.update(item)
			.set({ isRead: input.isRead })
			.where(and(eq(item.id, input.id), inArray(item.feedId, ownedFeedIds(ctx.db, ctx.session.user.id))))
			.returning({ id: item.id, isRead: item.isRead });

		if (!updated) throw notFound();
		return updated;
	}),

	setFavorite: protectedProcedure.input(setItemFavoriteSchema).mutation(async ({ input, ctx }) => {
		const [updated] = await ctx.db
			.update(item)
			.set({ isFavorite: input.isFavorite })
			.where(and(eq(item.id, input.id), inArray(item.feedId, ownedFeedIds(ctx.db, ctx.session.user.id))))
			.returning({ id: item.id, isFavorite: item.isFavorite });

		if (!updated) throw notFound();
		return updated;
	}),

	// Đánh dấu đã đọc hàng loạt (theo 1 feed hoặc toàn bộ). Chỉ đụng các bài đang chưa đọc.
	markAllRead: protectedProcedure.input(markAllReadSchema).mutation(async ({ input, ctx }) => {
		const conditions = [eq(item.isRead, false), inArray(item.feedId, ownedFeedIds(ctx.db, ctx.session.user.id))];
		if (input.feedId) conditions.push(eq(item.feedId, input.feedId));

		const rows = await ctx.db
			.update(item)
			.set({ isRead: true })
			.where(and(...conditions))
			.returning({ id: item.id });

		return { updated: rows.length };
	}),

	// Thay toàn bộ tag của bài. Kiểm tra cả bài lẫn tag đều thuộc user, chạy trong 1 transaction.
	setTags: protectedProcedure.input(setItemTagsSchema).mutation(async ({ input, ctx }) => {
		const userId = ctx.session.user.id;

		await ctx.db.transaction(async (tx) => {
			const [owned] = await tx
				.select({ id: item.id })
				.from(item)
				.where(and(eq(item.id, input.itemId), inArray(item.feedId, ownedFeedIds(tx, userId))))
				.limit(1);
			if (!owned) throw notFound();

			if (input.tagIds.length > 0) {
				const found = await tx
					.select({ id: tag.id })
					.from(tag)
					.where(and(eq(tag.userId, userId), inArray(tag.id, input.tagIds)));
				if (found.length !== input.tagIds.length) {
					throw new TRPCError({ code: "BAD_REQUEST", message: "Some tags do not exist." });
				}
			}

			await tx.delete(itemTag).where(eq(itemTag.itemId, input.itemId));
			if (input.tagIds.length > 0) {
				await tx.insert(itemTag).values(input.tagIds.map((tagId) => ({ itemId: input.itemId, tagId })));
			}
		});

		return { itemId: input.itemId, tagIds: input.tagIds };
	}),
});
