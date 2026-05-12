import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ────────────────────────────────────────────────────────────────────

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const runStatusEnum = pgEnum("run_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

// ── Workspaces ────────────────────────────────────────────────────────────────

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").notNull(), // references auth.users(id)
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Agents ────────────────────────────────────────────────────────────────────

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  goal: text("goal").notNull(),
  instructions: text("instructions"),
  model: text("model").notNull().default("openai/gpt-4o-mini"),
  provider: text("provider"),
  enabledToolsets: text("enabled_toolsets").array().default([]),
  disabledToolsets: text("disabled_toolsets").array().default([]),
  memoryEnabled: boolean("memory_enabled").default(false).notNull(),
  maxIterations: integer("max_iterations").default(20).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  status: taskStatusEnum("status").default("pending").notNull(),
  scheduleExpression: text("schedule_expression"), // cron or null for manual
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Task Runs ─────────────────────────────────────────────────────────────────

export const taskRuns = pgTable("task_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  status: runStatusEnum("status").default("pending").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  finalResponse: text("final_response"),
  errorMessage: text("error_message"),
  inputPrompt: text("input_prompt").notNull(),
  modelUsed: text("model_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Task Logs ─────────────────────────────────────────────────────────────────

export const taskLogs = pgTable("task_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskRunId: uuid("task_run_id")
    .notNull()
    .references(() => taskRuns.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // log | tool_start | tool_end | text_delta | done | error
  content: text("content").notNull(),
  toolName: text("tool_name"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Memories ──────────────────────────────────────────────────────────────────

export const memories = pgTable("memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Provider Keys ─────────────────────────────────────────────────────────────

export const providerKeys = pgTable("provider_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // openrouter | openai | groq | gemini | custom
  label: text("label").notNull(),
  // Store encrypted — never plaintext in SELECT results from client queries
  encryptedKey: text("encrypted_key").notNull(),
  baseUrl: text("base_url"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Usage Logs ────────────────────────────────────────────────────────────────

export const usageLogs = pgTable("usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  taskRunId: uuid("task_run_id").references(() => taskRuns.id),
  agentId: uuid("agent_id").references(() => agents.id),
  model: text("model"),
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  estimatedCostUsd: text("estimated_cost_usd"), // stored as string to avoid float precision issues
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  agents: many(agents),
  tasks: many(tasks),
  memories: many(memories),
  providerKeys: many(providerKeys),
  usageLogs: many(usageLogs),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [agents.workspaceId],
    references: [workspaces.id],
  }),
  tasks: many(tasks),
  memories: many(memories),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [tasks.workspaceId],
    references: [workspaces.id],
  }),
  agent: one(agents, {
    fields: [tasks.agentId],
    references: [agents.id],
  }),
  runs: many(taskRuns),
}));

export const taskRunsRelations = relations(taskRuns, ({ one, many }) => ({
  task: one(tasks, {
    fields: [taskRuns.taskId],
    references: [tasks.id],
  }),
  logs: many(taskLogs),
}));

export const taskLogsRelations = relations(taskLogs, ({ one }) => ({
  taskRun: one(taskRuns, {
    fields: [taskLogs.taskRunId],
    references: [taskRuns.id],
  }),
}));
