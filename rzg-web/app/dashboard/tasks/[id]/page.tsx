import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks, taskRuns, taskLogs, agents, workspaces } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot, Terminal } from "lucide-react";
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
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header bar */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/tasks"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"
          style={{ border: "1px solid #1e2640", color: "#4a5568" }}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{task.name}</h1>
          {agent && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Bot className="w-3 h-3" style={{ color: "#3b82f6" }} />
              <span className="text-xs" style={{ color: "#4a5568" }}>{agent.name}</span>
            </div>
          )}
        </div>
        <TaskActions taskId={task.id} />
      </div>

      {/* Prompt card */}
      <div className="rounded-xl p-4" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d3a52" }}>
            Prompt
          </span>
        </div>
        <p className="text-sm leading-relaxed text-white">{task.prompt}</p>
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
