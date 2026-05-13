import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks, agents, taskRuns, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, CheckCircle2, Clock, AlertCircle, ListTodo, ArrowRight } from "lucide-react";
import { NewTaskButton } from "@/components/tasks/new-task-button";

export const metadata = { title: "Tasks — RZG AI" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ agentId?: string }>;
}) {
  const { agentId: preselectedAgentId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, user!.id))
    .limit(1);

  const agentList = await db
    .select()
    .from(agents)
    .where(eq(agents.workspaceId, workspace.id));

  const taskList = await db
    .select({
      id: tasks.id,
      name: tasks.name,
      prompt: tasks.prompt,
      status: tasks.status,
      createdAt: tasks.createdAt,
      lastRunAt: tasks.lastRunAt,
      agentId: tasks.agentId,
      agentName: agents.name,
    })
    .from(tasks)
    .innerJoin(agents, eq(tasks.agentId, agents.id))
    .where(eq(tasks.workspaceId, workspace.id))
    .orderBy(desc(tasks.createdAt));

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">Automation</p>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {taskList.length} task{taskList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <NewTaskButton agents={agentList} defaultAgentId={preselectedAgentId} />
      </div>

      {taskList.length === 0 ? (
        <div className="glass rounded-2xl p-14 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto">
            <ListTodo className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <p className="font-semibold">No tasks yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {agentList.length === 0
                ? "Create an AI worker first, then assign it tasks."
                : "Create a task and run it with an AI worker."}
            </p>
          </div>
          {agentList.length === 0 ? (
            <Link
              href="/dashboard/agents/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Create AI Worker
            </Link>
          ) : (
            <NewTaskButton agents={agentList} defaultAgentId={preselectedAgentId} />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {taskList.map((task) => (
            <Link
              key={task.id}
              href={`/dashboard/tasks/${task.id}`}
              className="flex items-center gap-4 p-4 glass rounded-xl hover:border-blue-500/25 transition-all group"
            >
              <StatusIcon status={task.status} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm group-hover:text-blue-300 transition-colors">{task.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{task.prompt}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium text-muted-foreground">{task.agentName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {task.lastRunAt ? new Date(task.lastRunAt).toLocaleDateString() : "Never run"}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  const map = {
    completed: { icon: CheckCircle2, bg: "bg-green-500/10", color: "text-green-400" },
    running: { icon: Clock, bg: "bg-yellow-500/10", color: "text-yellow-400" },
    failed: { icon: AlertCircle, bg: "bg-red-500/10", color: "text-red-400" },
    pending: { icon: Clock, bg: "bg-white/5", color: "text-muted-foreground" },
    cancelled: { icon: Clock, bg: "bg-white/5", color: "text-muted-foreground" },
  } as const;
  const { icon: Icon, bg, color } = map[status as keyof typeof map] ?? map.pending;
  return (
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
      <Icon className={`w-4 h-4 ${color} ${status === "running" ? "animate-spin" : ""}`} />
    </div>
  );
}
