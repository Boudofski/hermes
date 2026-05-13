import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, Brain, Settings2 } from "lucide-react";
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
    <div className="min-h-screen min-w-0 max-w-full pb-28 md:pb-0">
      <div className="border-b border-white/10 px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/dashboard/agents" className="button-secondary mb-5 px-3 py-2">
          <ArrowLeft className="w-4 h-4" />
          Directory
        </Link>
        <div className="flex min-w-0 items-center gap-4">
          <div className="brand-mark h-12 w-12"><Bot className="h-6 w-6" /></div>
          <div className="min-w-0">
            <p className="eyebrow">Edit Worker</p>
            <h1 className="mt-1 truncate text-3xl font-black tracking-tight text-white">{agent.name}</h1>
            <p className="mt-1 truncate text-sm font-semibold text-cyan-100">{agent.role}</p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 p-4 sm:p-6 lg:p-8 2xl:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4">
          <div className="surface-card p-5">
            <Settings2 className="mb-4 h-7 w-7 text-cyan-200" />
            <h2 className="text-xl font-bold text-white">Runtime profile</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Tune this worker without touching task history, saved outputs, or Supabase authentication.
            </p>
          </div>
          <div className="metal-panel p-5">
            <Brain className="mb-4 h-7 w-7 text-cyan-200" />
            <p className="font-bold text-white">Memory is per worker</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Enable memory when the worker should preserve context across future missions.
            </p>
          </div>
        </aside>
        <main className="min-w-0">
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
        </main>
      </div>
    </div>
  );
}
