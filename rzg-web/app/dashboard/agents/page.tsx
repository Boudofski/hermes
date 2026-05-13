import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, tasks, workspaces } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { Bot, Brain, BriefcaseBusiness, IterationCcw, Layers, Pencil, Plus, Sparkles, Zap } from "lucide-react";
import { AGENT_TEMPLATES } from "@/lib/agent-templates";
import { CommandButton } from "@/components/ui/command-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata = { title: "AI Workers — RZG AI" };

export default async function AgentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, user!.id)).limit(1);

  const [agentList, taskCounts] = await Promise.all([
    db.select().from(agents).where(eq(agents.workspaceId, workspace.id)),
    db
      .select({ agentId: tasks.agentId, taskCount: count() })
      .from(tasks)
      .where(eq(tasks.workspaceId, workspace.id))
      .groupBy(tasks.agentId),
  ]);

  const taskCountMap = Object.fromEntries(taskCounts.map((r) => [r.agentId, r.taskCount]));

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <PageTitle
        eyebrow="AI Employee Directory"
        title="AI Workers"
        description={`${agentList.length} worker${agentList.length !== 1 ? "s" : ""} deployed. Hire, configure, and route missions to your AI employees.`}
        action={<CommandButton href="/dashboard/agents/new"><Plus className="h-4 w-4" /> New Worker</CommandButton>}
      />

      <div className="space-y-8 p-5 sm:p-8">
        {agentList.length === 0 ? (
          <EmptyState
            icon={<Bot className="h-7 w-7" />}
            title="No AI workers yet"
            description="Create your first autonomous AI employee from a template or configure one from scratch."
            action={<CommandButton href="/dashboard/agents/new"><Plus className="h-4 w-4" /> Create AI Worker</CommandButton>}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {agentList.map((agent, index) => {
              const taskCount = taskCountMap[agent.id] ?? 0;
              const accent = [
                "bg-cyan-300",
                "bg-blue-300",
                "bg-emerald-300",
                "bg-amber-300",
                "bg-sky-300",
                "bg-teal-300",
              ][index % 6];
              return (
                <article key={agent.id} className="surface-card surface-card-hover group overflow-hidden">
                  <div className={`h-1 ${accent}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="brand-mark h-12 w-12 shrink-0">
                          <Bot className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-black text-white">{agent.name}</h2>
                          <p className="mt-1 truncate text-sm font-semibold text-cyan-100">{agent.role}</p>
                        </div>
                      </div>
                      <StatusBadge status={agent.isActive ? "active" : "inactive"} />
                    </div>

                    <p className="mt-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-300">{agent.goal}</p>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <WorkerStat icon={<Layers className="h-4 w-4" />} label="Tasks" value={String(taskCount)} />
                      <WorkerStat icon={<Brain className="h-4 w-4" />} label="Memory" value={agent.memoryEnabled ? "On" : "Off"} active={agent.memoryEnabled} />
                      <WorkerStat icon={<IterationCcw className="h-4 w-4" />} label="Max Iter" value={String(agent.maxIterations)} />
                      <WorkerStat icon={<BriefcaseBusiness className="h-4 w-4" />} label="Model" value={agent.model.split("/").pop() ?? agent.model} />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <code className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 font-mono text-xs font-bold text-cyan-100">
                        {agent.model}
                      </code>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/agents/${agent.id}`} className="button-secondary px-3 py-2">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Link>
                        <Link href={`/dashboard/tasks?agentId=${agent.id}`} className="button-primary px-3 py-2">
                          <Zap className="h-4 w-4" />
                          Run Task
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section className="surface-panel p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="brand-mark h-10 w-10"><Sparkles className="h-5 w-5" /></div>
            <div>
              <p className="eyebrow">Hiring Templates</p>
              <h2 className="text-xl font-bold text-white">Start with a specialist profile</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {AGENT_TEMPLATES.slice(0, 8).map((template) => (
              <Link key={template.id} href="/dashboard/agents/new" className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/10">
                <p className="font-bold text-white">{template.name}</p>
                <p className="mt-1 text-sm font-semibold text-cyan-100">{template.role}</p>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-400">{template.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function WorkerStat({ icon, label, value, active }: { icon: React.ReactNode; label: string; value: string; active?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className={active ? "text-cyan-100" : "text-slate-400"}>{icon}</div>
      <p className="mt-2 truncate font-mono text-sm font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    </div>
  );
}
