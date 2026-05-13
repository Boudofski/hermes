import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, memories, tasks, taskRuns, workspaces } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import Link from "next/link";
import { Activity, ArrowRight, Bot, Brain, CheckCircle2, ListTodo, Plus, Radio, Zap } from "lucide-react";
import { CommandButton } from "@/components/ui/command-button";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageTitle } from "@/components/ui/page-title";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata = { title: "Dashboard — RZG AI" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, user!.id)).limit(1);

  const [[agentCount], [taskCount], [memoryCount], recentRuns] = await Promise.all([
    db.select({ count: count() }).from(agents).where(eq(agents.workspaceId, workspace.id)),
    db.select({ count: count() }).from(tasks).where(eq(tasks.workspaceId, workspace.id)),
    db.select({ count: count() }).from(memories).where(eq(memories.workspaceId, workspace.id)),
    db.select({
      id: taskRuns.id,
      status: taskRuns.status,
      startedAt: taskRuns.startedAt,
      completedAt: taskRuns.completedAt,
      createdAt: taskRuns.createdAt,
      taskId: taskRuns.taskId,
      taskName: tasks.name,
      inputPrompt: taskRuns.inputPrompt,
    })
      .from(taskRuns)
      .innerJoin(tasks, eq(taskRuns.taskId, tasks.id))
      .where(eq(tasks.workspaceId, workspace.id))
      .orderBy(desc(taskRuns.createdAt))
      .limit(8),
  ]);

  const completedRuns = recentRuns.filter((r) => r.status === "completed").length;
  const runningRuns = recentRuns.filter((r) => r.status === "running").length;
  const failedRuns = recentRuns.filter((r) => r.status === "failed").length;

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <PageTitle
        eyebrow="Command Center"
        title="Operations Overview"
        description={`${workspace.name} workspace. Monitor real workers, tasks, runs, and memory state from live platform data.`}
        action={
          <CommandButton href="/dashboard/agents/new">
            <Plus className="h-4 w-4" />
            New Worker
          </CommandButton>
        }
      />

      <div className="grid gap-6 p-5 sm:p-8 xl:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Workers" value={agentCount.count} icon={<Bot className="h-5 w-5" />} detail="AI employees deployed in this workspace." />
            <MetricCard label="Total Tasks" value={taskCount.count} icon={<ListTodo className="h-5 w-5" />} detail="Business missions assigned to workers." />
            <MetricCard label="Completed Runs" value={completedRuns} icon={<CheckCircle2 className="h-5 w-5" />} detail="Completed in the latest activity window." />
            <MetricCard label="Memories" value={memoryCount.count} icon={<Brain className="h-5 w-5" />} detail="Persistent context entries in the vault." />
          </div>

          <div className="surface-panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">Recent Task Activity</p>
                <h2 className="mt-1 text-xl font-bold text-white">Execution feed</h2>
              </div>
              <Link href="/dashboard/tasks" className="button-secondary px-3 py-2">
                All tasks <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {recentRuns.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Zap className="h-7 w-7" />}
                  title="No executions yet"
                  description="Create an AI worker and run a task. Live runs and saved results will appear here."
                  action={
                    agentCount.count === 0 ? (
                      <CommandButton href="/dashboard/agents/new"><Plus className="h-4 w-4" /> Create your first worker</CommandButton>
                    ) : (
                      <CommandButton href="/dashboard/tasks"><Zap className="h-4 w-4" /> Run a task</CommandButton>
                    )
                  }
                />
              </div>
            ) : (
              <div>
                {recentRuns.map((run) => (
                  <Link key={run.id} href={`/dashboard/tasks/${run.taskId}`} className="activity-row group">
                    <RunDot status={run.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white group-hover:text-cyan-100">{run.taskName}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">{run.inputPrompt}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge status={run.status} />
                      <p className="mt-2 text-xs font-medium text-slate-400">
                        {run.startedAt ? new Date(run.startedAt).toLocaleDateString() : new Date(run.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="surface-card p-5">
            <p className="eyebrow">Quick Launch</p>
            <div className="mt-4 space-y-3">
              <QuickLaunch href="/dashboard/agents/new" icon={<Bot className="h-5 w-5" />} title="Hire AI Worker" detail="Create from template or custom role." />
              <QuickLaunch href="/dashboard/tasks" icon={<Zap className="h-5 w-5" />} title="Run Mission" detail="Assign a prompt to a worker." />
              <QuickLaunch href="/dashboard/memory" icon={<Brain className="h-5 w-5" />} title="Open Memory Vault" detail="Store durable context." />
            </div>
          </div>

          <div className="metal-panel p-5">
            <p className="eyebrow">System Status</p>
            <div className="mt-4 space-y-3">
              <SystemRow label="Backend adapter" status="online" />
              <SystemRow label="Live streaming" status="live" />
              <SystemRow label="Memory layer" status={memoryCount.count > 0 ? "ready" : "idle"} />
              <SystemRow label="Running tasks" value={runningRuns} status={runningRuns > 0 ? "live" : "idle"} />
              <SystemRow label="Recent failures" value={failedRuns} status={failedRuns > 0 ? "failed" : "ready"} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function QuickLaunch({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/10">
      <div className="brand-mark h-11 w-11 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}

function SystemRow({ label, status, value }: { label: string; status: string; value?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <div className="flex items-center gap-2">
        {typeof value === "number" && <span className="font-mono text-sm font-bold text-white">{value}</span>}
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function RunDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-emerald-300",
    running: "bg-amber-300 animate-pulse-dot",
    failed: "bg-red-300",
    cancelled: "bg-slate-500",
    pending: "bg-slate-500",
  };
  return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors[status] ?? colors.pending}`} />;
}
