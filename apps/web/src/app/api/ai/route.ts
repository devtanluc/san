import { devToolsMiddleware } from "@ai-sdk/devtools";
import { google } from "@ai-sdk/google";
import {
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
  convertToModelMessages,
  wrapLanguageModel,
} from "ai";
import { createAILogger, createEvlogIntegration } from "evlog/ai";

import { withEvlog, useLogger } from "@/lib/evlog";
import { identifyEvlogUser } from "@/lib/evlog-auth";

export const maxDuration = 30;

export const POST = withEvlog(async (req: Request) => {
  await identifyEvlogUser(req);
  const { messages }: { messages: UIMessage[] } = await req.json();

  const ai = createAILogger(useLogger());

  const model = wrapLanguageModel({
    model: google("gemini-2.5-flash"),
    middleware: devToolsMiddleware(),
  });
  const result = streamText({
    model: ai.wrap(model),
    messages: await convertToModelMessages(messages),
    telemetry: {
      isEnabled: true,
      integrations: [createEvlogIntegration(ai)],
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
});
