import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const MODEL_ID = "gemini-3.8-flash";
const MAX_CONTENT_CHARS = 12_000;

function clip(text: string, max = MAX_CONTENT_CHARS) {
	if (text.length <= max) return text;
	return `${text.slice(0, max)}\n\n[truncated]`;
}

export async function generateItemSummary(input: { title: string; content: string }) {
	const { text } = await generateText({
		model: google(MODEL_ID),
		system: "You summarize RSS articles for a reading app. Write in the same language as the article. Use short paragraphs and optional bullet points. No title, preamble, or closing.",
		prompt: `Title: ${input.title}\n\n${clip(input.content)}`,
	});

	const summaryText = text.trim();
	if (!summaryText) {
		throw new Error("The model returned an empty summary.");
	}

	return { text: summaryText, model: MODEL_ID };
}
