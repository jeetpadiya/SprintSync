import { pgTable, uuid, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).default("MEMBER").notNull(), // ADMIN, MEMBER, GUEST
  title: varchar("title", { length: 100 }), // Job title, e.g. "Software Engineer"
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Refresh Tokens Table (Dual-token rotation & reuse detection)
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(), // SHA-256 hash
  familyId: uuid("family_id").notNull(), // Tracks token family for reuse detection
  userAgent: text("user_agent"),
  revoked: boolean("revoked").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Workspaces Table
export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  region: varchar("region", { length: 50 }).default("europe").notNull(), // europe, asia
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Workspace Members Table
export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  role: varchar("role", { length: 50 }).default("ADMIN").notNull(), // ADMIN, MEMBER, GUEST
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// 5. Workspace Invitations Table
export const workspaceInvitations = pgTable("workspace_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("MEMBER").notNull(),
  invitedBy: uuid("invited_by")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  workspaces: many(workspaceMembers),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

// Inferred TypeScript Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;
export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect;
export type NewWorkspaceInvitation = typeof workspaceInvitations.$inferInsert;
