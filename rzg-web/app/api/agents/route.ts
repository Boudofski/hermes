import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AgentSchema } from "@/lib/validations";
import { getAuthenticatedWorkspace, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  const rows = await db
    .select()
    .from(agents)
    .where(eq(agents.workspaceId, auth.workspace.id))
    .orderBy(agents.createdAt);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const parsed = AgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { enabledToolsets, disabledToolsets, ...rest } = parsed.data;

  const [agent] = await db
    .insert(agents)
    .values({
      workspaceId: auth.workspace.id,
      enabledToolsets: enabledToolsets ?? [],
      disabledToolsets: disabledToolsets ?? [],
      ...rest,
    })
    .returning();

  return NextResponse.json(agent, { status: 201 });
}
