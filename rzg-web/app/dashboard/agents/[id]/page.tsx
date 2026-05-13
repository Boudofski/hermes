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
  return { title: `Edit Worker — RZG AI` };
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
    <div className="p-6 max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/agents"
          className="w-8 h-8 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 flex items-center justify-center transition-all text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/15 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Edit</p>
            <h1 className="text-xl font-bold leading-tight">{agent.name}</h1>
          </div>
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
