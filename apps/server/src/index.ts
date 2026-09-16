import { devToolsMiddleware } from "@ai-sdk/devtools";
import { google } from "@ai-sdk/google";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "@san/api/routers/index";
import {
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  convertToModelMessages,
  wrapLanguageModel,
} from "ai";
import { initLogger } from "evlog";
import { createAILogger, createEvlogIntegration } from "evlog/ai";
import { createFsDrain } from "evlog/fs";
import { evlog, type EvlogVariables } from "evlog/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { createContext } from "./context";
import { env } from "./env.server";

initLogger({
  env: { service: "san-server" },
});

const app = new Hono<EvlogVariables>();

app.use(evlog({ drain: process.env.NODE_ENV === "production" ? undefined : createFsDrain() }));

app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.post("/ai", async (c) => {
  const body = await c.req.json();
  const uiMessages = body.messages || [];
  const ai = createAILogger(c.get("log"));
  const model = wrapLanguageModel({
    model: google("gemini-2.5-flash"),
    middleware: devToolsMiddleware(),
  });
  const result = streamText({
    model: ai.wrap(model),
    messages: await convertToModelMessages(uiMessages),
    telemetry: {
      isEnabled: true,
      integrations: [createEvlogIntegration(ai)],
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
});

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
