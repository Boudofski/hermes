import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { memories, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  key: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
});

async function getWorkspace(userId: string) {
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, userId)).limit(1);
  return workspace ?? null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspace(user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(memories)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(memories.id, id), eq(memories.workspaceId, workspace.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ memory: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getWorkspace(user.id);
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

  const deleted = await db
    .delete(memories)
    .where(and(eq(memories.id, id), eq(memories.workspaceId, workspace.id)))
    .returning({ id: memories.id });

  if (!deleted.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
