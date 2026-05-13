import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks, taskRuns, taskLogs, agents, workspaces } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot } from "lucide-react";
import Link from "next/link";
import { TaskRunner } from "@/components/tasks/task-runner";
import { TaskActions } from "@/components/tasks/task-actions";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  return { title: `Task — RZG AI` };
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/tasks"
          className="w-8 h-8 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 flex items-center justify-center transition-all text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold truncate">{task.name}</h1>
          </div>
          {agent && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Bot className="w-3 h-3 text-blue-400" />
              <p className="text-xs text-muted-foreground">{agent.name}</p>
            </div>
          )}
        </div>
        <TaskActions taskId={task.id} />
      </div>

      {/* Prompt */}
      <div className="glass rounded-2xl p-4 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Prompt</p>
        <p className="text-sm leading-relaxed">{task.prompt}</p>
      </div>

      {/* Runner */}
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
