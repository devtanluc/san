import type { Database } from "@san/db";
import * as schema from "@san/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

export type AuthConfig = {
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
};

export function createAuth(env: AuthConfig, database: Database) {
	return betterAuth({
		database: drizzleAdapter(database, {
			provider: "pg",
			schema,
		}),

		trustedOrigins: [env.BETTER_AUTH_URL],

		emailAndPassword: { enabled: true },

		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,

		user: {
			additionalFields: {
				username: {
					type: "string",
					required: true,
					input: true,
					returned: true,
				},

				tagline: {
					type: "string",
					required: false,
					input: true,
					returned: true,
				},

				bio: {
					type: "string",
					required: false,
					input: true,
					returned: true,
				},

				defaultPostStatus: {
					type: "string",
					required: false,
					input: true,
					returned: true,
				},

				isPublicProfileEnabled: {
					type: "boolean",
					required: false,
					input: true,
					returned: true,
				},

				isHiddenFromSearch: {
					type: "boolean",
					required: false,
					input: true,
					returned: true,
				},

				isVisibleInPublicFeed: {
					type: "boolean",
					required: false,
					input: true,
					returned: true,
				},

				writingGoals: {
					type: "string[]",
					required: false,
					input: true,
					returned: true,
				},

				onboardingCompletedAt: {
					type: "date",
					required: false,
					input: false,
					returned: true,
				},
			},
		},

		plugins: [nextCookies()],
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
