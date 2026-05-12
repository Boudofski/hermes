import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, taskRuns, taskLogs, agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { RunTaskSchema } from "@/lib/validations";
import { getAuthenticatedWorkspace, errorResponse } from "@/lib/api-helpers";
import { streamExecution } from "@/lib/hermes-client";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const parsed = RunTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Load task + agent
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.workspaceId, auth.workspace.id)));
  if (!task) return errorResponse("Task not found", 404);

  const [agent] = await db.select().from(agents).where(eq(agents.id, task.agentId));
  if (!agent) return errorResponse("Agent not found", 404);

  const prompt = parsed.data.overridePrompt || task.prompt;

  // Create task run record
  const [run] = await db
    .insert(taskRuns)
    .values({
      taskId: task.id,
      status: "running",
      startedAt: new Date(),
      inputPrompt: prompt,
      modelUsed: agent.model,
    })
    .returning();

  // Update task status
  await db.update(tasks).set({ status: "running", lastRunAt: new Date() }).where(eq(tasks.id, id));

  // Stream SSE from hermes-adapter to client, persisting log lines to DB
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const adapterRes = await streamExecution({
          task_run_id: run.id,
          message: prompt,
          agent_config: {
            name: agent.name,
            role: agent.role,
            goal: agent.goal,
            instructions: agent.instructions ?? undefined,
            enabled_toolsets: agent.enabledToolsets ?? [],
            disabled_toolsets: agent.disabledToolsets ?? [],
            memory_enabled: agent.memoryEnabled,
          },
          model: agent.model,
          api_key: parsed.data.apiKey,
          max_iterations: agent.maxIterations,
        });

        if (!adapterRes.body) throw new Error("No response body from adapter");

        const reader = adapterRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalResponse = "";
        let hasError = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const chunk of lines) {
            const dataLine = chunk.trim();
            if (!dataLine.startsWith("data:")) continue;

            const raw = dataLine.slice(5).trim();
            if (raw === "[DONE]") continue;

            // Forward to client
            controller.enqueue(encoder.encode(`data: ${raw}\n\n`));

            // Persist to DB
            try {
              const event = JSON.parse(raw);
              await db.insert(taskLogs).values({
                taskRunId: run.id,
                eventType: event.type,
                content: event.content,
                toolName: event.tool_name ?? null,
                metadata: event.metadata ?? null,
              });

              if (event.type === "done") finalResponse = event.content;
              if (event.type === "error") hasError = true;
            } catch {
              // Malformed JSON from adapter — skip persisting, still forward
            }
          }
        }

        // Finalize task run
        const finalStatus = hasError ? "failed" : "completed";
        await db
          .update(taskRuns)
          .set({
            status: finalStatus,
            completedAt: new Date(),
            finalResponse: finalResponse || null,
          })
          .where(eq(taskRuns.id, run.id));

        await db
          .update(tasks)
          .set({ status: finalStatus })
          .where(eq(tasks.id, id));

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";

        await db.update(taskRuns).set({ status: "failed", errorMessage: msg, completedAt: new Date() }).where(eq(taskRuns.id, run.id));
        await db.update(tasks).set({ status: "failed" }).where(eq(tasks.id, id));

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", content: msg })}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      "X-Run-Id": run.id,
    },
  });
}
