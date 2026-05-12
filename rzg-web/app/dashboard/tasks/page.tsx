import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks, agents, taskRuns, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, CheckCircle2, Clock, AlertCircle, ListTodo } from "lucide-react";
import { NewTaskButton } from "@/components/tasks/new-task-button";

export const metadata = { title: "Tasks" };

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
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{taskList.length} task{taskList.length !== 1 ? "s" : ""}</p>
        </div>
        <NewTaskButton agents={agentList} defaultAgentId={preselectedAgentId} />
      </div>

      {taskList.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-4">
          <ListTodo className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium">No tasks yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {agentList.length === 0
                ? "Create an AI worker first, then assign it tasks."
                : "Create a task and run it with an AI worker."}
            </p>
          </div>
          {agentList.length === 0 ? (
            <Link href="/dashboard/agents/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
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
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-blue-500/40 transition-colors"
            >
              <StatusBadge status={task.status} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{task.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{task.prompt}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">{task.agentName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {task.lastRunAt ? new Date(task.lastRunAt).toLocaleDateString() : "Never run"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    completed: { icon: <CheckCircle2 className="w-4 h-4" />, cls: "text-green-400" },
    running: { icon: <Clock className="w-4 h-4 animate-spin" />, cls: "text-yellow-400" },
    failed: { icon: <AlertCircle className="w-4 h-4" />, cls: "text-destructive" },
    pending: { icon: <Clock className="w-4 h-4" />, cls: "text-muted-foreground" },
    cancelled: { icon: <Clock className="w-4 h-4" />, cls: "text-muted-foreground" },
  } as const;
  const { icon, cls } = cfg[status as keyof typeof cfg] ?? cfg.pending;
  return <div className={cls}>{icon}</div>;
}
