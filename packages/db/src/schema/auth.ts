import * as p from "drizzle-orm/pg-core";
import { postStatusEnum } from "./post";

export const writingGoalEnum = p.pgEnum("writing_goal", [
	"understand_self", // hiểu mình
	"think_clearer", // suy nghĩ rõ hơn
	"share", // chia sẻ
	"remember", // ghi nhớ
]);

export const user = p.pgTable("user", {
	id: p.text("id").primaryKey(),
	name: p.text("name").notNull(),
	email: p.text("email").notNull().unique(),
	emailVerified: p.boolean("email_verified").default(false).notNull(),
	image: p.text("image"),

	// Mở rộng thêm
	username: p.varchar("username", { length: 32 }).notNull(),
	tagline: p.varchar("tagline", { length: 140 }),
	bio: p.text("bio"),

	defaultPostStatus: postStatusEnum("default_post_status")
		.notNull()
		.default("private"),
	isPublicProfileEnabled: p
		.boolean("is_public_profile_enabled")
		.notNull()
		.default(true),
	isHiddenFromSearch: p
		.boolean("is_hidden_from_search")
		.notNull()
		.default(false),
	isVisibleInPublicFeed: p
		.boolean("is_visible_in_public_feed")
		.notNull()
		.default(true),

	// Onboarding
	writingGoals: writingGoalEnum("writing_goals").array(),
	onboardingCompletedAt: p.timestamp("onboarding_completed_at"),

	createdAt: p.timestamp("created_at").defaultNow().notNull(),
	updatedAt: p
		.timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const session = p.pgTable(
	"session",
	{
		id: p.text("id").primaryKey(),
		expiresAt: p.timestamp("expires_at").notNull(),
		token: p.text("token").notNull().unique(),
		createdAt: p.timestamp("created_at").defaultNow().notNull(),
		updatedAt: p
			.timestamp("updated_at")
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: p.text("ip_address"),
		userAgent: p.text("user_agent"),
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [p.index("session_userId_idx").on(table.userId)],
);

export const account = p.pgTable(
	"account",
	{
		id: p.text("id").primaryKey(),
		accountId: p.text("account_id").notNull(),
		providerId: p.text("provider_id").notNull(),
		userId: p
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: p.text("access_token"),
		refreshToken: p.text("refresh_token"),
		idToken: p.text("id_token"),
		accessTokenExpiresAt: p.timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: p.timestamp("refresh_token_expires_at"),
		scope: p.text("scope"),
		password: p.text("password"),
		createdAt: p.timestamp("created_at").defaultNow().notNull(),
		updatedAt: p
			.timestamp("updated_at")
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [p.index("account_userId_idx").on(table.userId)],
);

export const verification = p.pgTable(
	"verification",
	{
		id: p.text("id").primaryKey(),
		identifier: p.text("identifier").notNull(),
		value: p.text("value").notNull(),
		expiresAt: p.timestamp("expires_at").notNull(),
		createdAt: p.timestamp("created_at").defaultNow().notNull(),
		updatedAt: p
			.timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [p.index("verification_identifier_idx").on(table.identifier)],
);

// export const userRelations = relations(user, ({ many }) => ({
// 	sessions: many(session),
// 	accounts: many(account),
// }));

// export const sessionRelations = relations(session, ({ one }) => ({
// 	user: one(user, {
// 		fields: [session.userId],
// 		references: [user.id],
// 	}),
// }));

// export const accountRelations = relations(account, ({ one }) => ({
// 	user: one(user, {
// 		fields: [account.userId],
// 		references: [user.id],
// 	}),
// }));
