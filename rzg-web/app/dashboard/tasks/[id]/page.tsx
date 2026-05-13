import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks, taskRuns, taskLogs, agents, workspaces } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot, FileText } from "lucide-react";
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

  const statusBadgeClass: Record<string, string> = {
    pending:   "badge badge-muted",
    running:   "badge badge-yellow",
    completed: "badge badge-green",
    failed:    "badge badge-red",
    cancelled: "badge badge-muted",
  };

  return (
    <div className="h-full flex flex-col">
      {/* Command panel — sticky header */}
      <div className="px-8 py-5 border-b border-border bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/tasks"
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold truncate">{task.name}</h1>
              <span className={statusBadgeClass[task.status] ?? "badge badge-muted"}>
                {task.status}
              </span>
            </div>
            {agent && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Bot className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-muted-foreground">{agent.name}</span>
                <span className="text-muted-foreground/30">·</span>
                <code className="text-xs text-muted-foreground/70 font-mono">
                  {agent.model.split("/").pop()}
                </code>
              </div>
            )}
          </div>

          <TaskActions taskId={task.id} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-6 space-y-5">
          {/* Prompt card */}
          <div className="panel rounded-xl">
            <div className="panel-header">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Task Prompt
              </span>
            </div>
            <div className="p-4">
              <p className="text-sm leading-relaxed">{task.prompt}</p>
            </div>
          </div>

          {/* Execution console */}
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
      </div>
    </div>
  );
}
