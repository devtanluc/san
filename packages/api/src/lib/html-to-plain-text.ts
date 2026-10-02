import { convert } from "html-to-text";

const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"].map((selector) => ({
	selector,
	options: { uppercase: false },
}));

export function htmlToPlainText(input: string | null | undefined): string | null {
	if (!input) return null;

	const text = convert(input, {
		wordwrap: false,
		selectors: [
			{ selector: "script", format: "skip" },
			{ selector: "style", format: "skip" },
			{ selector: "img", format: "skip" },
			{ selector: "a", options: { ignoreHref: true } },
			...HEADINGS,
		],
	})
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	return text.length > 0 ? text : null;
}
