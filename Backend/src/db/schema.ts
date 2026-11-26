import { pgTable, uuid, varchar, text, timestamp, boolean, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";
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

// 6. Teams Table (e.g. Engineering -> key: "ENG")
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  key: varchar("key", { length: 10 }).notNull(), // e.g. "ENG"
  issueCounter: integer("issue_counter").default(0).notNull(), // Atomically incremented for issue numbers
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 7. Labels Table
export const labels = pgTable("labels", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  color: varchar("color", { length: 30 }).default("#8a8f98").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Issues Table
export const issues = pgTable("issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  teamId: uuid("teamId")
    .references(() => teams.id, { onDelete: "cascade" })
    .notNull(),
  number: integer("number").notNull(), // e.g. 101
  identifier: varchar("identifier", { length: 50 }).notNull(), // e.g. "ENG-101"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("TODO").notNull(), // BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELED
  priority: varchar("priority", { length: 50 }).default("NO_PRIORITY").notNull(), // NO_PRIORITY, LOW, MEDIUM, HIGH, URGENT
  estimate: integer("estimate"), // 1, 2, 3, 5, 8 (Fibonacci)
  sortOrder: doublePrecision("sort_order").default(0).notNull(),
  assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
  creatorId: uuid("creator_id").references(() => users.id, { onDelete: "set null" }),
  parentId: uuid("parent_id"), // Parent issue if sub-issue
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 9. Issue Labels Mapping Table
export const issueLabels = pgTable("issue_labels", {
  id: uuid("id").primaryKey().defaultRandom(),
  issueId: uuid("issue_id")
    .references(() => issues.id, { onDelete: "cascade" })
    .notNull(),
  labelId: uuid("label_id")
    .references(() => labels.id, { onDelete: "cascade" })
    .notNull(),
});

// 10. Issue Relations Table (blocks, blocked_by, duplicate, related)
export const issueRelations = pgTable("issue_relations", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceIssueId: uuid("source_issue_id")
    .references(() => issues.id, { onDelete: "cascade" })
    .notNull(),
  targetIssueId: uuid("target_issue_id")
    .references(() => issues.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 30 }).notNull(), // BLOCKS, BLOCKED_BY, DUPLICATE, RELATED
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. Documents Table (Linear-style collaborative specs & notes with Tiptap JSON tree)
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).default("Untitled").notNull(),
  icon: varchar("icon", { length: 30 }),
  content: jsonb("content"), // Tiptap JSON document tree
  creatorId: uuid("creator_id").references(() => users.id, { onDelete: "set null" }),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type IssueLabel = typeof issueLabels.$inferSelect;
export type NewIssueLabel = typeof issueLabels.$inferInsert;
export type IssueRelation = typeof issueRelations.$inferSelect;
export type NewIssueRelation = typeof issueRelations.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
