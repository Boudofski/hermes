import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, tasks, taskRuns, workspaces } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import Link from "next/link";
import { Bot, ListTodo, CheckCircle2, Clock, AlertCircle, Plus } from "lucide-react";

export const metadata = { title: "Dashboard" };

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

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{workspace.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="AI Workers" value={agentCount.count} icon={<Bot className="w-4 h-4 text-blue-400" />} />
        <StatCard label="Tasks" value={taskCount.count} icon={<ListTodo className="w-4 h-4 text-violet-400" />} />
        <StatCard label="Completed" value={recentRuns.filter(r => r.status === "completed").length} icon={<CheckCircle2 className="w-4 h-4 text-green-400" />} />
        <StatCard label="Running" value={recentRuns.filter(r => r.status === "running").length} icon={<Clock className="w-4 h-4 text-yellow-400" />} />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          href="/dashboard/agents/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New AI Worker
        </Link>
        <Link
          href="/dashboard/tasks"
          className="flex items-center gap-2 px-4 py-2 border border-border hover:bg-secondary text-sm font-medium rounded-lg transition-colors"
        >
          <ListTodo className="w-4 h-4" />
          View Tasks
        </Link>
      </div>

      {/* Recent runs */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h2>
        {recentRuns.length === 0 ? (
          <EmptyState
            message="No task runs yet"
            action={{ href: "/dashboard/agents/new", label: "Create your first AI worker" }}
          />
        ) : (
          <div className="space-y-2">
            {recentRuns.map((run) => (
              <Link
                key={run.id}
                href={`/dashboard/tasks/${run.taskId}`}
                className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg hover:border-blue-500/40 transition-colors"
              >
                <RunStatusIcon status={run.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{run.taskName}</p>
                  <p className="text-xs text-muted-foreground truncate">{run.inputPrompt}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {run.startedAt ? new Date(run.startedAt).toLocaleDateString() : "—"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function RunStatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />;
  if (status === "running") return <Clock className="w-4 h-4 text-yellow-400 shrink-0 animate-spin" />;
  if (status === "failed") return <AlertCircle className="w-4 h-4 text-destructive shrink-0" />;
  return <Clock className="w-4 h-4 text-muted-foreground shrink-0" />;
}

function EmptyState({ message, action }: { message: string; action: { href: string; label: string } }) {
  return (
    <div className="border border-dashed border-border rounded-lg p-8 text-center space-y-3">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link href={action.href} className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline">
        <Plus className="w-3 h-3" />
        {action.label}
      </Link>
    </div>
  );
}
