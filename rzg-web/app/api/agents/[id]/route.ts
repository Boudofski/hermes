import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AgentSchema } from "@/lib/validations";
import { getAuthenticatedWorkspace, errorResponse } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.workspaceId, auth.workspace.id)));

  if (!agent) return errorResponse("Agent not found", 404);
  return NextResponse.json(agent);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = AgentSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { enabledToolsets, disabledToolsets, ...rest } = parsed.data;

  const [updated] = await db
    .update(agents)
    .set({
      ...(enabledToolsets !== undefined && { enabledToolsets }),
      ...(disabledToolsets !== undefined && { disabledToolsets }),
      ...rest,
      updatedAt: new Date(),
    })
    .where(and(eq(agents.id, id), eq(agents.workspaceId, auth.workspace.id)))
    .returning();

  if (!updated) return errorResponse("Agent not found", 404);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  await db
    .delete(agents)
    .where(and(eq(agents.id, id), eq(agents.workspaceId, auth.workspace.id)));

  return new NextResponse(null, { status: 204 });
}
