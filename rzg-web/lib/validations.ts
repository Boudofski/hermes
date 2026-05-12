import { z } from "zod";

export const AgentSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(200),
  goal: z.string().min(1).max(1000),
  instructions: z.string().max(5000).optional(),
  model: z.string().min(1).default("openai/gpt-4o-mini"),
  provider: z.string().optional(),
  enabledToolsets: z.array(z.string()).optional(),
  disabledToolsets: z.array(z.string()).optional(),
  memoryEnabled: z.boolean().default(false),
  maxIterations: z.number().int().min(1).max(90).default(20),
});

export const TaskSchema = z.object({
  agentId: z.string().uuid(),
  name: z.string().min(1).max(200),
  prompt: z.string().min(1).max(10000),
  scheduleExpression: z.string().optional(),
});

export const RunTaskSchema = z.object({
  overridePrompt: z.string().optional(),
  apiKey: z.string().optional(),
});

export const MemorySchema = z.object({
  agentId: z.string().uuid().optional(),
  key: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
});

export type AgentInput = z.infer<typeof AgentSchema>;
export type TaskInput = z.infer<typeof TaskSchema>;
export type RunTaskInput = z.infer<typeof RunTaskSchema>;
export type MemoryInput = z.infer<typeof MemorySchema>;
