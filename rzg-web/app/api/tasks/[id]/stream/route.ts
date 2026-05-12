import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskLogs, taskRuns, tasks } from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { getAuthenticatedWorkspace, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/** Return persisted logs for a task run — used when re-opening a completed task. */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  const runId = req.nextUrl.searchParams.get("run_id");

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.workspaceId, auth.workspace.id)));
  if (!task) return errorResponse("Task not found", 404);

  const run = runId
    ? (await db.select().from(taskRuns).where(eq(taskRuns.id, runId)))[0]
    : (
        await db
          .select()
          .from(taskRuns)
          .where(eq(taskRuns.taskId, id))
          .orderBy(desc(taskRuns.createdAt))
          .limit(1)
      )[0];

  if (!run) return NextResponse.json({ logs: [], run: null });

  const logs = await db
    .select()
    .from(taskLogs)
    .where(eq(taskLogs.taskRunId, run.id))
    .orderBy(asc(taskLogs.createdAt));

  return NextResponse.json({ logs, run });
}
