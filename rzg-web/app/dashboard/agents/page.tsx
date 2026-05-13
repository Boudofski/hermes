import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, tasks, workspaces } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { Bot, Plus, Pencil, Zap, Brain, Layers, IterationCcw } from "lucide-react";

export const metadata = { title: "AI Workers — RZG AI" };

const ACCENT_CLASSES = [
  "accent-blue",
  "accent-cyan",
  "accent-violet",
  "accent-green",
  "accent-amber",
  "accent-pink",
];

const ACCENT_COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#22c55e", "#f59e0b", "#ec4899"];

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
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="px-8 py-6 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-1">Workforce</p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Workers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {agentList.length} worker{agentList.length !== 1 ? "s" : ""} deployed
            </p>
          </div>
          <Link
            href="/dashboard/agents/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Worker
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {agentList.length === 0 ? (
          <div className="max-w-md mx-auto mt-16 text-center">
            <div className="panel rounded-2xl p-12 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                <Bot className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold">No AI workers yet</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Create your first autonomous AI worker from a template or from scratch.
                </p>
              </div>
              <Link
                href="/dashboard/agents/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create AI Worker
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 max-w-6xl">
            {agentList.map((agent, i) => {
              const accentClass = ACCENT_CLASSES[i % ACCENT_CLASSES.length];
              const accentColor = ACCENT_COLORS[i % ACCENT_COLORS.length];
              const taskCount = taskCountMap[agent.id] ?? 0;

              return (
                <div key={agent.id} className={`worker-card flex flex-col ${accentClass}`}>
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Identity row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}28` }}
                        >
                          <Bot className="w-5 h-5" style={{ color: accentColor }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{agent.name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.role}</p>
                        </div>
                      </div>
                      <span className={agent.isActive ? "badge badge-green shrink-0" : "badge badge-muted shrink-0"}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Goal */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                      {agent.goal}
                    </p>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      <StatChip
                        icon={<Layers className="w-3 h-3" />}
                        label="Tasks"
                        value={String(taskCount)}
                      />
                      <StatChip
                        icon={<Brain className="w-3 h-3" />}
                        label="Memory"
                        value={agent.memoryEnabled ? "On" : "Off"}
                        active={agent.memoryEnabled}
                      />
                      <StatChip
                        icon={<IterationCcw className="w-3 h-3" />}
                        label="Max iter"
                        value={String(agent.maxIterations)}
                      />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                      <code className="text-xs px-2 py-0.5 rounded bg-white/4 border border-border text-blue-400 font-mono">
                        {agent.model.split("/").pop()}
                      </code>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/agents/${agent.id}`}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/tasks?agentId=${agent.id}`}
                          className="flex items-center gap-1 text-xs font-medium transition-colors"
                          style={{ color: accentColor }}
                        >
                          <Zap className="w-3 h-3" />
                          Run Task
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg bg-white/3 border border-border/50">
      <div className={`${active ? "text-cyan-400" : "text-muted-foreground"}`}>{icon}</div>
      <span className="text-xs font-semibold tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">{label}</span>
    </div>
  );
}
