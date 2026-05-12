import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { memories, workspaces, agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const CreateSchema = z.object({
  key: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  agentId: z.string().uuid().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, user.id)).limit(1);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const rows = await db
    .select({
      id: memories.id,
      key: memories.key,
      content: memories.content,
      agentId: memories.agentId,
      agentName: agents.name,
      createdAt: memories.createdAt,
      updatedAt: memories.updatedAt,
    })
    .from(memories)
    .leftJoin(agents, eq(memories.agentId, agents.id))
    .where(eq(memories.workspaceId, workspace.id))
    .orderBy(memories.createdAt);

  return NextResponse.json({ memories: rows });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, user.id)).limit(1);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  if (parsed.data.agentId) {
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, parsed.data.agentId), eq(agents.workspaceId, workspace.id)));
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const [memory] = await db
    .insert(memories)
    .values({
      workspaceId: workspace.id,
      agentId: parsed.data.agentId ?? null,
      key: parsed.data.key,
      content: parsed.data.content,
    })
    .returning();

  return NextResponse.json({ memory }, { status: 201 });
}
