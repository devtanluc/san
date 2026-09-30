import { feedTypeEnum } from "@san/db/schema";
import * as z from "zod";

// * Helpers

/**
 * Chuẩn hoá URL để unique (userId, url) hoạt động đúng:
 * - host tự lowercase (do WHATWG URL)
 * - bỏ fragment
 * - bỏ trailing slash ("/feed/" -> "/feed", "https://a.com/" -> "https://a.com")
 */
export function normalizeUrl(raw: string): string {
	const url = new URL(raw);
	url.hash = "";
	if (url.pathname.length > 1) {
		url.pathname = url.pathname.replace(/\/+$/, "");
	}
	let out = url.toString();
	if (url.pathname === "/" && !url.search) {
		out = out.replace(/\/$/, "");
	}
	return out;
}

// Chỉ cho phép http/https, chặn javascript:, file:, ftp:...
// Lưu ý: KHÔNG chặn được SSRF (localhost, 169.254.x.x...) -> xử lý ở tầng fetch RSS.
const httpUrl = (message: string) => z.url({ protocol: /^https?$/, error: message });

// * Fields (dùng cho INPUT: khắt khe, có message cho người dùng)

export const feedIdSchema = z.uuid({ error: "Invalid feed id." });

export const feedUrlInputSchema = httpUrl("Invalid feed url.").transform(normalizeUrl);

export const feedTitleInputSchema = z
	.string()
	.trim()
	.min(1, { error: "Title cannot be empty." })
	.max(200, { error: "Title must be 200 characters or fewer." });

export const feedTypeSchema = z.enum(feedTypeEnum.enumValues, {
	error: "Invalid feed type.",
});

// * Fields (dùng cho OUTPUT: đọc từ DB, chỉ kiểm tra hình dạng, không siết rule)

const feedUrlOutputSchema = z.string();
const feedTitleOutputSchema = z.string();
const feedIconUrlOutputSchema = z.string().nullable();

// * Objects

export const selectFeedSchema = z.object({
	id: feedIdSchema,
	userId: z.string(),
	type: feedTypeSchema,
	url: feedUrlOutputSchema,
	title: feedTitleOutputSchema,
	iconUrl: feedIconUrlOutputSchema,
	createdAt: z.coerce.date(),
});

export const createFeedSchema = z.object({
	url: feedUrlInputSchema,
	title: feedTitleInputSchema,
	type: feedTypeSchema.default("rss"),
});

export const syncFeedSchema = z.object({
	id: feedIdSchema,
});

export const deleteFeedSchema = z.object({
	id: feedIdSchema,
});

// * Types

export type SelectFeed = z.output<typeof selectFeedSchema>;
// input: `type` là optional (do có default)
export type CreateFeedInput = z.input<typeof createFeedSchema>;
// output: dữ liệu sau khi parse, `type` chắc chắn có, url đã chuẩn hoá -> dùng trong service
export type CreateFeed = z.output<typeof createFeedSchema>;
export type SyncFeedInput = z.input<typeof syncFeedSchema>;
export type DeleteFeedInput = z.input<typeof deleteFeedSchema>;
