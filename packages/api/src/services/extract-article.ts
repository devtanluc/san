import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import sanitizeHtml from "sanitize-html";
import { safeFetchPage } from "../lib/safe-fetch";

const MAX_ELEMS = 20_000; // chặn trang DOM quá lớn làm treo CPU

// Trả về HTML đã làm sạch của phần nội dung chính, hoặc null nếu không trích được
export async function extractArticleHtml(url: string): Promise<string | null> {
	const html = await safeFetchPage(url);

	let content: string | null | undefined;
	try {
		const { document } = parseHTML(html);
		// Để Readability resolve link/ảnh tương đối
		const base = document.createElement("base");
		base.setAttribute("href", url);
		document.head.appendChild(base);

		content = new Readability(document, { maxElemsToParse: MAX_ELEMS }).parse()?.content;
	} catch {
		return null; // HTML hỏng hoặc quá lớn: coi như không trích được
	}
	if (!content) return null;

	const clean = sanitizeHtml(content, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "figure", "figcaption"]),
		allowedAttributes: { a: ["href", "rel", "target"], img: ["src", "alt"] },
		allowedSchemes: ["http", "https"],
		transformTags: {
			a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow", target: "_blank" }),
		},
	});

	return clean.trim() || null;
}
