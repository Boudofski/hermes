import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, tasks, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { ArrowRight, Bot, CalendarClock, ListTodo, Plus } from "lucide-react";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { CommandButton } from "@/components/ui/command-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata = { title: "Tasks — RZG AI" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ agentId?: string }> }) {
  const { agentId: preselectedAgentId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, user!.id)).limit(1);

  const agentList = await db.select().from(agents).where(eq(agents.workspaceId, workspace.id));

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
    <div className="min-h-screen pb-24 md:pb-0">
      <PageTitle
        eyebrow="Mission Control"
        title="Tasks"
        description={`${taskList.length} mission${taskList.length !== 1 ? "s" : ""} assigned to AI workers. Create, inspect, and run executions from here.`}
        action={<NewTaskButton agents={agentList} defaultAgentId={preselectedAgentId} />}
      />

      <div className="p-5 sm:p-8">
        {taskList.length === 0 ? (
          <EmptyState
            icon={<ListTodo className="h-7 w-7" />}
            title="No tasks yet"
            description={agentList.length === 0 ? "Create an AI worker first, then assign it missions." : "Create a mission and run it with an AI worker."}
            action={
              agentList.length === 0 ? (
                <CommandButton href="/dashboard/agents/new"><Plus className="h-4 w-4" /> Create AI Worker</CommandButton>
              ) : (
                <NewTaskButton agents={agentList} defaultAgentId={preselectedAgentId} />
              )
            }
          />
        ) : (
          <div className="surface-panel overflow-hidden">
            <div className="hidden border-b border-white/10 bg-white/[0.035] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 lg:grid lg:grid-cols-[1fr_210px_150px_130px_40px]">
              <span>Mission</span>
              <span>Worker</span>
              <span>Status</span>
              <span>Last Run</span>
              <span />
            </div>
            <div className="divide-y divide-white/10">
              {taskList.map((task) => (
                <Link key={task.id} href={`/dashboard/tasks/${task.id}`} className="grid gap-4 px-5 py-5 transition hover:bg-cyan-300/[0.035] lg:grid-cols-[1fr_210px_150px_130px_40px] lg:items-center">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2 lg:hidden">
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="truncate text-base font-black text-white">{task.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">{task.prompt}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Bot className="h-4 w-4 text-cyan-200" />
                    <span className="truncate">{task.agentName}</span>
                  </div>
                  <div className="hidden lg:block">
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <CalendarClock className="h-4 w-4 text-slate-500" />
                    {task.lastRunAt ? new Date(task.lastRunAt).toLocaleDateString() : "Never"}
                  </div>
                  <ArrowRight className="hidden h-4 w-4 text-slate-500 lg:block" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
