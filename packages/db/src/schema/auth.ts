import * as p from "drizzle-orm/pg-core";

export const user = p.pgTable("user", {
	id: p.text("id").primaryKey(),
	name: p.text("name").notNull(),
	email: p.text("email").notNull().unique(),
	emailVerified: p.boolean("email_verified").default(false).notNull(),
	image: p.text("image"),
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
