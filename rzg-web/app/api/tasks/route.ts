import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, agents } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TaskSchema } from "@/lib/validations";
import { getAuthenticatedWorkspace, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  const rows = await db
    .select({
      id: tasks.id,
      name: tasks.name,
      prompt: tasks.prompt,
      status: tasks.status,
      scheduleExpression: tasks.scheduleExpression,
      lastRunAt: tasks.lastRunAt,
      createdAt: tasks.createdAt,
      agentId: tasks.agentId,
      agentName: agents.name,
      agentRole: agents.role,
    })
    .from(tasks)
    .innerJoin(agents, eq(tasks.agentId, agents.id))
    .where(eq(tasks.workspaceId, auth.workspace.id))
    .orderBy(desc(tasks.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = TaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Verify the agent belongs to this workspace
  const [agent] = await db
    .select()
    .from(agents)
    .where(
      and(
        eq(agents.id, parsed.data.agentId),
        eq(agents.workspaceId, auth.workspace.id)
      )
    );
  if (!agent) return errorResponse("Agent not found", 404);

  const [task] = await db
    .insert(tasks)
    .values({ workspaceId: auth.workspace.id, ...parsed.data })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
