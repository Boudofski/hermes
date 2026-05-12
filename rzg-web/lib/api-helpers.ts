import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function getAuthenticatedWorkspace() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, user.id))
    .limit(1);

  if (!workspace) {
    return { error: NextResponse.json({ error: "Workspace not found" }, { status: 404 }) };
  }

  return { user, workspace };
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}
