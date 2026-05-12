import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks, taskRuns, taskLogs, agents, workspaces } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TaskRunner } from "@/components/tasks/task-runner";
import { TaskActions } from "@/components/tasks/task-actions";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  return { title: `Task ${id.slice(0, 8)}` };
}

export default async function TaskDetailPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, user!.id))
    .limit(1);

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.workspaceId, workspace.id)));

  if (!task) notFound();

  const [agent] = await db.select().from(agents).where(eq(agents.id, task.agentId));

  const recentRuns = await db
    .select()
    .from(taskRuns)
    .where(eq(taskRuns.taskId, task.id))
    .orderBy(desc(taskRuns.createdAt))
    .limit(10);

  const latestRun = recentRuns[0] ?? null;

  const logs = latestRun
    ? await db
        .select()
        .from(taskLogs)
        .where(eq(taskLogs.taskRunId, latestRun.id))
        .orderBy(taskLogs.createdAt)
    : [];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tasks" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{task.name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Worker: {agent?.name ?? "Unknown"}</p>
        </div>
        <TaskActions taskId={task.id} />
      </div>

      {/* Prompt */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Prompt</p>
        <p className="text-sm">{task.prompt}</p>
      </div>

      {/* Runner — handles run button, live SSE logs, output */}
      <TaskRunner
        task={{ id: task.id, name: task.name, status: task.status }}
        agent={agent ? { id: agent.id, name: agent.name } : null}
        initialRun={latestRun}
        initialLogs={logs}
        runHistory={recentRuns.slice(1).map((r) => ({
          id: r.id,
          status: r.status,
          createdAt: r.createdAt,
          completedAt: r.completedAt,
          finalResponse: r.finalResponse,
          errorMessage: r.errorMessage,
        }))}
      />
    </div>
  );
}
