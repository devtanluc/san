const BLOCK_BREAK = /<\/(p|div|h[1-6]|li|tr|blockquote|article|section)>/gi;
const LINE_BREAK = /<br\s*\/?>/gi;

export function htmlToPlainText(input: string | null | undefined): string | null {
	if (!input) return null;

	const text = input
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(LINE_BREAK, "\n")
		.replace(BLOCK_BREAK, "\n\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
		.replace(/\u00a0/g, " ")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();

	return text.length > 0 ? text : null;
}
