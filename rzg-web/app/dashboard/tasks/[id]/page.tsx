import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks, taskRuns, taskLogs, agents, workspaces } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot, FileText, Terminal } from "lucide-react";
import Link from "next/link";
import { TaskRunner } from "@/components/tasks/task-runner";
import { TaskActions } from "@/components/tasks/task-actions";

type Params = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ autorun?: string }>;
};

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  return { title: `Task — RZG AI` };
}

export default async function TaskDetailPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { autorun } = (await searchParams) ?? {};
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
    <div className="min-h-screen min-w-0 max-w-full pb-28 md:pb-0">
      <div className="border-b border-white/10 bg-[#02050b]/70 px-4 py-5 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:items-center">
            <Link href="/dashboard/tasks" className="button-secondary px-3 py-2">
            <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <p className="eyebrow">Mission Detail</p>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-3">
                <h1 className="min-w-0 break-words text-2xl font-black tracking-tight text-white sm:truncate">{task.name}</h1>
                <span className={`badge ${task.status === "completed" ? "badge-green" : task.status === "running" ? "badge-yellow" : task.status === "failed" ? "badge-red" : "badge-muted"}`}>
                  {task.status}
                </span>
              </div>
            {agent && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-300">
                <Bot className="h-4 w-4 text-cyan-200" />
                <span>{agent.name}</span>
                <span className="text-slate-600">·</span>
                <code className="font-mono text-xs text-cyan-100">
                  {agent.model.split("/").pop()}
                </code>
              </div>
            )}
            </div>
          </div>
          <TaskActions taskId={task.id} />
        </div>
      </div>

      <div className="mx-auto min-w-0 max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8">
        <details className="surface-card min-w-0 overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 border-b border-white/10 px-5 py-4">
            <FileText className="h-4 w-4 text-cyan-200" />
            <span className="eyebrow">Prompt Panel</span>
            <span className="ml-auto text-xs font-semibold text-slate-300">Expand brief</span>
          </summary>
          <div className="p-5">
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-100">{task.prompt}</p>
          </div>
        </details>

        <div className="flex items-center gap-2 px-1">
          <Terminal className="h-4 w-4 text-cyan-200" />
          <p className="eyebrow">Execution Console</p>
        </div>

        <TaskRunner
          task={{ id: task.id, name: task.name, status: task.status, prompt: task.prompt }}
          agent={agent ? { id: agent.id, name: agent.name } : null}
          initialRun={latestRun}
          initialLogs={logs}
          autorun={autorun === "1"}
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
  );
}
