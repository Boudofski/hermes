import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";
import { EditAgentForm } from "@/components/agents/edit-agent-form";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  return { title: `Edit Agent ${id.slice(0, 8)}` };
}

export default async function EditAgentPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, user!.id)).limit(1);

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.workspaceId, workspace.id)));

  if (!agent) notFound();

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/agents" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          <h1 className="text-xl font-semibold">Edit AI Worker</h1>
        </div>
      </div>

      <EditAgentForm
        agent={{
          id: agent.id,
          name: agent.name,
          role: agent.role,
          goal: agent.goal,
          instructions: agent.instructions ?? null,
          model: agent.model,
          memoryEnabled: agent.memoryEnabled,
          maxIterations: agent.maxIterations,
        }}
      />
    </div>
  );
}
