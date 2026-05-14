import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, taskRuns, tasks, workspaces } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, Brain, Clock3, FileOutput, History, Layers, Settings2, Wrench } from "lucide-react";
import { EditAgentForm } from "@/components/agents/edit-agent-form";
import { StatusBadge } from "@/components/ui/status-badge";

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

  const enabledToolsets = agent.enabledToolsets ?? [];

  const recentRuns = await db
    .select({
      id: taskRuns.id,
      status: taskRuns.status,
      createdAt: taskRuns.createdAt,
      taskName: tasks.name,
    })
    .from(taskRuns)
    .innerJoin(tasks, eq(taskRuns.taskId, tasks.id))
    .where(and(eq(tasks.agentId, agent.id), eq(tasks.workspaceId, workspace.id)))
    .orderBy(desc(taskRuns.createdAt))
    .limit(3);

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
          <section className="mb-6 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <CapabilityPanel icon={<Bot className="h-5 w-5" />} label="Model" value={agent.model.split("/").pop() ?? agent.model} detail="Configured on this worker." />
            <CapabilityPanel icon={<Brain className="h-5 w-5" />} label="Memory" value={agent.memoryEnabled ? "Enabled" : "Disabled"} detail={agent.memoryEnabled ? "Worker can use persistent context." : "Can be enabled in runtime settings."} />
            <CapabilityPanel icon={<Wrench className="h-5 w-5" />} label="Tools" value={enabledToolsets.length ? enabledToolsets.join(", ") : "Engine-ready"} detail={enabledToolsets.length ? "Explicit toolsets configured." : "Hermes supports tool-capable execution; no custom toolsets selected."} />
            <CapabilityPanel icon={<Clock3 className="h-5 w-5" />} label="Schedule" value={enabledToolsets.includes("cronjob") ? "Configured" : "Coming soon"} detail="Scheduled workflows are available in Hermes and planned for RZG UI." muted={!enabledToolsets.includes("cronjob")} />
            <CapabilityPanel icon={<FileOutput className="h-5 w-5" />} label="Output Type" value="Task-level" detail="Choose report, checklist, email, table, strategy, and more when creating a task." />
            <CapabilityPanel icon={<Layers className="h-5 w-5" />} label="Max Iterations" value={String(agent.maxIterations)} detail="Tool-calling budget for a run." />
          </section>

          <section className="surface-card mb-6 p-5">
            <div className="mb-4 flex items-center gap-2">
              <History className="h-4 w-4 text-cyan-200" />
              <p className="eyebrow">Last Runs</p>
            </div>
            {recentRuns.length === 0 ? (
              <p className="text-sm leading-6 text-slate-300">No runs recorded for this worker yet. Create a task to start building execution history.</p>
            ) : (
              <div className="space-y-2">
                {recentRuns.map((run) => (
                  <div key={run.id} className="flex min-w-0 flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{run.taskName}</p>
                      <p className="text-xs font-semibold text-slate-300">{new Date(run.createdAt).toLocaleString()}</p>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>
                ))}
              </div>
            )}
          </section>

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

function CapabilityPanel({ icon, label, value, detail, muted }: { icon: React.ReactNode; label: string; value: string; detail: string; muted?: boolean }) {
  return (
    <div className="surface-card min-w-0 p-4">
      <div className={muted ? "mb-3 text-slate-300" : "brand-mark mb-3 h-10 w-10"}>{icon}</div>
      <p className="eyebrow">{label}</p>
      <p className="mt-2 truncate text-lg font-black text-white">{value}</p>
      <p className="mt-1 min-h-10 break-words text-xs leading-5 text-slate-300">{detail}</p>
    </div>
  );
}
