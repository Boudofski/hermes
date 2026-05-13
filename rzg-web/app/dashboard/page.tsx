import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, tasks, taskRuns, workspaces } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import Link from "next/link";
import {
  Bot, ListTodo, CheckCircle2, Clock, AlertCircle, Plus, ArrowRight, Zap, Activity,
} from "lucide-react";

export const metadata = { title: "Dashboard — RZG AI" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, user!.id)).limit(1);

  const [[agentCount], [taskCount], recentRuns] = await Promise.all([
    db.select({ count: count() }).from(agents).where(eq(agents.workspaceId, workspace.id)),
    db.select({ count: count() }).from(tasks).where(eq(tasks.workspaceId, workspace.id)),
    db.select({
      id: taskRuns.id,
      status: taskRuns.status,
      startedAt: taskRuns.startedAt,
      completedAt: taskRuns.completedAt,
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

  const completedRuns = recentRuns.filter((r) => r.status === "completed");
  const failedRuns    = recentRuns.filter((r) => r.status === "failed");
  const runningRuns   = recentRuns.filter((r) => r.status === "running");

  const isEmpty = recentRuns.length === 0;

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="px-8 py-6 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/70 mb-1">Command Center</p>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{workspace.name}</p>
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

      {/* 3-column layout */}
      <div className="flex-1 grid grid-cols-[220px_1fr_260px] divide-x divide-border overflow-hidden">

        {/* ── Left: Operations summary ── */}
        <div className="overflow-y-auto p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Metrics</p>

          <div className="space-y-2">
            <StatRow
              icon={<Bot className="w-4 h-4 text-blue-400" />}
              label="AI Workers"
              value={agentCount.count}
              href="/dashboard/agents"
            />
            <StatRow
              icon={<ListTodo className="w-4 h-4 text-violet-400" />}
              label="Tasks"
              value={taskCount.count}
              href="/dashboard/tasks"
            />
            <StatRow
              icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
              label="Completed"
              value={completedRuns.length}
            />
            <StatRow
              icon={<Activity className="w-4 h-4 text-yellow-400" />}
              label="Running"
              value={runningRuns.length}
            />
            <StatRow
              icon={<AlertCircle className="w-4 h-4 text-red-400" />}
              label="Failed"
              value={failedRuns.length}
            />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">System</p>
            <div className="space-y-2">
              <SystemRow label="Adapter" status="online" />
              <SystemRow label="Memory" status={agentCount.count > 0 ? "ready" : "idle"} />
              <SystemRow label="Streaming" status="live" />
            </div>
          </div>
        </div>

        {/* ── Center: Activity feed ── */}
        <div className="overflow-y-auto flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Recent Executions
            </p>
            <Link href="/dashboard/tasks" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              All tasks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <p className="font-semibold text-sm mb-1">No executions yet</p>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-6">
                Create an AI worker and run a task. Every execution will appear here as a real-time feed.
              </p>
              {agentCount.count === 0 ? (
                <Link href="/dashboard/agents/new" className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  <Plus className="w-3.5 h-3.5" />
                  Create your first AI worker
                </Link>
              ) : (
                <Link href="/dashboard/tasks" className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  <Zap className="w-3.5 h-3.5" />
                  Run a task
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recentRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/dashboard/tasks/${run.taskId}`}
                  className="activity-row group"
                >
                  <RunDot status={run.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-blue-300 transition-colors">
                      {run.taskName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{run.inputPrompt}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <RunStatusBadge status={run.status} />
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      {run.startedAt ? new Date(run.startedAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Quick launch + info ── */}
        <div className="overflow-y-auto p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
              Quick Launch
            </p>
            <div className="space-y-2">
              <Link
                href="/dashboard/agents/new"
                className="flex items-center gap-3 p-3 panel rounded-lg hover:border-blue-500/30 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">New AI Worker</p>
                  <p className="text-xs text-muted-foreground">From template</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                href="/dashboard/tasks"
                className="flex items-center gap-3 p-3 panel rounded-lg hover:border-violet-500/30 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">Run Task</p>
                  <p className="text-xs text-muted-foreground">Execute now</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                href="/dashboard/memory"
                className="flex items-center gap-3 p-3 panel rounded-lg hover:border-cyan-500/30 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">Memory Vault</p>
                  <p className="text-xs text-muted-foreground">Manage context</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* Run breakdown */}
          {recentRuns.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
                Run Breakdown
              </p>
              <div className="panel rounded-lg overflow-hidden">
                <BreakdownRow label="Completed" count={completedRuns.length} color="bg-green-500" total={recentRuns.length} />
                <BreakdownRow label="Running"   count={runningRuns.length}   color="bg-yellow-500" total={recentRuns.length} />
                <BreakdownRow label="Failed"    count={failedRuns.length}    color="bg-red-500"    total={recentRuns.length} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function StatRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href?: string }) {
  const inner = (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/3 transition-colors group">
      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">{icon}</div>
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-bold tabular-nums text-foreground">{value}</span>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

function SystemRow({ label, status }: { label: string; status: string }) {
  const statusMap: Record<string, { dot: string; text: string; label: string }> = {
    online: { dot: "bg-green-500", text: "text-green-400", label: "Online" },
    live:   { dot: "bg-blue-400 animate-pulse-dot", text: "text-blue-400", label: "Live" },
    ready:  { dot: "bg-green-500", text: "text-green-400", label: "Ready" },
    idle:   { dot: "bg-muted-foreground/30", text: "text-muted-foreground", label: "Idle" },
  };
  const cfg = statusMap[status] ?? statusMap.idle;
  return (
    <div className="flex items-center justify-between px-3 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
      </div>
    </div>
  );
}

function RunDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-green-500",
    running:   "bg-yellow-400",
    failed:    "bg-red-500",
    cancelled: "bg-muted-foreground/40",
    pending:   "bg-muted-foreground/40",
  };
  return <div className={`w-2 h-2 rounded-full shrink-0 ${colors[status] ?? colors.pending}`} />;
}

function RunStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    completed: "badge badge-green",
    running:   "badge badge-yellow",
    failed:    "badge badge-red",
    cancelled: "badge badge-muted",
    pending:   "badge badge-muted",
  };
  return <span className={cfg[status] ?? cfg.pending}>{status}</span>;
}

function BreakdownRow({ label, count, color, total }: { label: string; count: number; color: string; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0">
      <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
      <span className="flex-1 text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold tabular-nums">{count}</span>
      <span className="text-xs text-muted-foreground/50 w-8 text-right">{pct}%</span>
    </div>
  );
}
