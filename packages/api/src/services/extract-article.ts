import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import sanitizeHtml from "sanitize-html";
import { safeFetchPage } from "../lib/safe-fetch";

// Trả về HTML đã làm sạch của phần nội dung chính, hoặc null nếu không trích được
export async function extractArticleHtml(url: string): Promise<string | null> {
	const html = await safeFetchPage(url);

	const { document } = parseHTML(html);
	// Để Readability resolve link/ảnh tương đối
	const base = document.createElement("base");
	base.setAttribute("href", url);
	document.head.appendChild(base);

	const article = new Readability(document as unknown as Document).parse();
	if (!article?.content) return null;

	const clean = sanitizeHtml(article.content, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "figure", "figcaption"]),
		allowedAttributes: { a: ["href"], img: ["src", "alt"] },
		allowedSchemes: ["http", "https"],
	});
	return clean.trim() || null;
}
