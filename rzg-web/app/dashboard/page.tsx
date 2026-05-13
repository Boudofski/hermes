import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, tasks, taskRuns, workspaces } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import Link from "next/link";
import {
  Bot, ListTodo, CheckCircle2, Clock, AlertCircle,
  Plus, ArrowRight, Zap,
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
    .limit(5);

  const completedCount = recentRuns.filter((r) => r.status === "completed").length;
  const runningCount = recentRuns.filter((r) => r.status === "running").length;

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-blue-400 uppercase tracking-widest mb-1">Command Center</p>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">{workspace.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="AI Workers"
          value={agentCount.count}
          icon={<Bot className="w-4 h-4 text-blue-400" />}
          accent="blue"
        />
        <StatCard
          label="Tasks"
          value={taskCount.count}
          icon={<ListTodo className="w-4 h-4 text-violet-400" />}
          accent="violet"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
          accent="green"
        />
        <StatCard
          label="Running"
          value={runningCount}
          icon={<Zap className="w-4 h-4 text-yellow-400" />}
          accent="yellow"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/agents/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all glow-blue"
        >
          <Plus className="w-4 h-4" />
          New AI Worker
        </Link>
        <Link
          href="/dashboard/tasks"
          className="inline-flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 text-sm font-medium rounded-xl transition-all"
        >
          <ListTodo className="w-4 h-4" />
          View Tasks
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
        </Link>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-widest text-xs">
          Recent Activity
        </h2>
        {recentRuns.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-sm">No runs yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create an AI worker and run your first task to see activity here.
              </p>
            </div>
            <Link
              href="/dashboard/agents/new"
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create your first AI worker
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentRuns.map((run) => (
              <Link
                key={run.id}
                href={`/dashboard/tasks/${run.taskId}`}
                className="flex items-center gap-4 p-4 glass rounded-xl hover:border-blue-500/25 transition-all group"
              >
                <RunStatusIcon status={run.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-blue-300 transition-colors">
                    {run.taskName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{run.inputPrompt}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {run.startedAt ? new Date(run.startedAt).toLocaleDateString() : "—"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "blue" | "violet" | "green" | "yellow";
}) {
  const accentMap = {
    blue: "from-blue-600/10",
    violet: "from-violet-600/10",
    green: "from-green-600/10",
    yellow: "from-yellow-600/10",
  };
  return (
    <div className={`glass rounded-xl p-4 bg-gradient-to-br ${accentMap[accent]} to-transparent`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function RunStatusIcon({ status }: { status: string }) {
  if (status === "completed") return (
    <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
    </div>
  );
  if (status === "running") return (
    <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
      <Clock className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
    </div>
  );
  if (status === "failed") return (
    <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
    </div>
  );
  return (
    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
    </div>
  );
}
