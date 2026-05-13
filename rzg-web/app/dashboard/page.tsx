import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, tasks, taskRuns, workspaces } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import Link from "next/link";
import {
  Bot, ListTodo, CheckCircle2, Clock, AlertCircle, Plus, ArrowRight, Zap,
} from "lucide-react";

export const metadata = { title: "Dashboard — RZG AI" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, user!.id))
    .limit(1);

  const [agentCount] = await db
    .select({ count: count() })
    .from(agents)
    .where(eq(agents.workspaceId, workspace.id));

  const [taskCount] = await db
    .select({ count: count() })
    .from(tasks)
    .where(eq(tasks.workspaceId, workspace.id));

  const recentRuns = await db
    .select({
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
    .limit(8);

  const completedCount = recentRuns.filter((r) => r.status === "completed").length;
  const runningCount = recentRuns.filter((r) => r.status === "running").length;

  return (
    <div className="p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#2d4a8a" }}>
            Command Center
          </p>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: "#4a5568" }}>{workspace.name}</p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
          style={{ background: "#1d4ed8" }}
        >
          <Plus className="w-4 h-4" />
          New Worker
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="AI Workers" value={agentCount.count} icon={<Bot className="w-4 h-4" />} accentColor="#3b82f6" />
        <StatCard label="Tasks" value={taskCount.count} icon={<ListTodo className="w-4 h-4" />} accentColor="#8b5cf6" />
        <StatCard label="Completed" value={completedCount} icon={<CheckCircle2 className="w-4 h-4" />} accentColor="#22c55e" />
        <StatCard label="Running" value={runningCount} icon={<Zap className="w-4 h-4" />} accentColor="#f59e0b" />
      </div>

      {/* Activity feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d3a52" }}>
            Recent Activity
          </h2>
          <Link href="/dashboard/tasks" className="text-xs flex items-center gap-1 transition-colors" style={{ color: "#4a5568" }}>
            All tasks <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentRuns.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" }}>
              <Bot className="w-5 h-5" style={{ color: "#3b82f6" }} />
            </div>
            <p className="text-sm font-medium text-white mb-1">No runs yet</p>
            <p className="text-xs mb-4" style={{ color: "#4a5568" }}>
              Create an AI worker and run your first task to see activity here.
            </p>
            <Link
              href="/dashboard/agents/new"
              className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: "#3b82f6" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Create your first AI worker
            </Link>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e2640" }}>
            {recentRuns.map((run, i) => (
              <Link
                key={run.id}
                href={`/dashboard/tasks/${run.taskId}`}
                className="flex items-center gap-4 px-4 py-3 group transition-all"
                style={{
                  background: i % 2 === 0 ? "#0b0e18" : "#0d1120",
                  borderBottom: i < recentRuns.length - 1 ? "1px solid #151c2c" : "none",
                }}
              >
                <RunStatusDot status={run.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate" style={{ marginBottom: 1 }}>
                    {run.taskName}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#3a4455" }}>{run.inputPrompt}</p>
                </div>
                <div className="shrink-0 text-right">
                  <RunStatusBadge status={run.status} />
                  <p className="text-xs mt-0.5" style={{ color: "#2d3a52" }}>
                    {run.startedAt ? new Date(run.startedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: "#3a4455" }} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      {(agentCount.count === 0 || taskCount.count === 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {agentCount.count === 0 && (
            <QuickAction
              href="/dashboard/agents/new"
              icon={<Bot className="w-5 h-5" style={{ color: "#3b82f6" }} />}
              title="Create your first AI worker"
              description="Set up a specialist agent from a template"
              accentColor="rgba(37,99,235,0.08)"
            />
          )}
          {agentCount.count > 0 && taskCount.count === 0 && (
            <QuickAction
              href="/dashboard/tasks"
              icon={<Zap className="w-5 h-5" style={{ color: "#8b5cf6" }} />}
              title="Run your first task"
              description="Assign a task to your AI worker and watch it execute"
              accentColor="rgba(139,92,246,0.08)"
            />
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, icon, accentColor,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: "#4a5568" }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}22`, color: accentColor }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}

function RunStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "#22c55e",
    running: "#f59e0b",
    failed: "#ef4444",
    cancelled: "#4a5568",
    pending: "#4a5568",
  };
  const color = colors[status] ?? colors.pending;
  return (
    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
  );
}

function RunStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    completed: { label: "Completed", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    running: { label: "Running", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    failed: { label: "Failed", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    cancelled: { label: "Cancelled", color: "#4a5568", bg: "rgba(74,85,104,0.1)" },
    pending: { label: "Pending", color: "#4a5568", bg: "rgba(74,85,104,0.1)" },
  };
  const { label, color, bg } = cfg[status] ?? cfg.pending;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

function QuickAction({
  href, icon, title, description, accentColor,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 p-5 rounded-xl transition-all group"
      style={{ background: "#0b0e18", border: "1px solid #1e2640" }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all" style={{ background: accentColor, border: "1px solid rgba(255,255,255,0.06)" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
        <p className="text-xs leading-relaxed" style={{ color: "#4a5568" }}>{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#4a5568" }} />
    </Link>
  );
}
