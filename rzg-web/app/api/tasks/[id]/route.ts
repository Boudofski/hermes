import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, taskRuns, agents } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthenticatedWorkspace, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.workspaceId, auth.workspace.id)));

  if (!task) return errorResponse("Task not found", 404);

  const runs = await db
    .select()
    .from(taskRuns)
    .where(eq(taskRuns.taskId, id))
    .orderBy(desc(taskRuns.createdAt))
    .limit(20);

  const [agent] = await db.select().from(agents).where(eq(agents.id, task.agentId));

  return NextResponse.json({ ...task, agent, runs });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.workspaceId, auth.workspace.id)));

  return new NextResponse(null, { status: 204 });
}
