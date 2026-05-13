import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks, agents, workspaces } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, ListTodo, ArrowRight } from "lucide-react";
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
    <div className="p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#4a2a8a" }}>
            Automation
          </p>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-sm mt-0.5" style={{ color: "#4a5568" }}>
            {taskList.length} task{taskList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <NewTaskButton agents={agentList} defaultAgentId={preselectedAgentId} />
      </div>

      {taskList.length === 0 ? (
        <div className="rounded-xl p-14 text-center" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <ListTodo className="w-6 h-6" style={{ color: "#8b5cf6" }} />
          </div>
          <p className="text-sm font-semibold text-white mb-1">No tasks yet</p>
          <p className="text-xs mb-5" style={{ color: "#4a5568" }}>
            {agentList.length === 0
              ? "Create an AI worker first, then assign it tasks."
              : "Create a task and run it with an AI worker."}
          </p>
          {agentList.length === 0 ? (
            <Link
              href="/dashboard/agents/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#1d4ed8" }}
            >
              Create AI Worker
            </Link>
          ) : (
            <NewTaskButton agents={agentList} defaultAgentId={preselectedAgentId} />
          )}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e2640" }}>
          {/* Table header */}
          <div className="grid grid-cols-[1fr_140px_110px_100px_40px] gap-0 px-4 py-2.5"
            style={{ background: "#0d1120", borderBottom: "1px solid #1e2640" }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d3a52" }}>Task</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d3a52" }}>Worker</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d3a52" }}>Status</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d3a52" }}>Last Run</span>
            <span />
          </div>

          {/* Rows */}
          {taskList.map((task, i) => (
            <Link
              key={task.id}
              href={`/dashboard/tasks/${task.id}`}
              className="grid grid-cols-[1fr_140px_110px_100px_40px] gap-0 px-4 py-3 group items-center transition-all"
              style={{
                background: i % 2 === 0 ? "#0b0e18" : "#0d1120",
                borderBottom: i < taskList.length - 1 ? "1px solid #131928" : "none",
              }}
            >
              <div className="min-w-0 pr-4">
                <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                  {task.name}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: "#2d3a52" }}>{task.prompt}</p>
              </div>
              <div className="min-w-0 pr-2">
                <span className="text-xs truncate block" style={{ color: "#4a5568" }}>{task.agentName}</span>
              </div>
              <div>
                <StatusBadge status={task.status} />
              </div>
              <div>
                <span className="text-xs" style={{ color: "#2d3a52" }}>
                  {task.lastRunAt ? new Date(task.lastRunAt).toLocaleDateString() : "Never"}
                </span>
              </div>
              <div className="flex justify-end">
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#3a4455" }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
    completed: { label: "Completed", icon: CheckCircle2, color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    running:   { label: "Running",   icon: Clock,         color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    failed:    { label: "Failed",    icon: AlertCircle,   color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    pending:   { label: "Pending",   icon: Clock,         color: "#4a5568", bg: "rgba(74,85,104,0.1)" },
    cancelled: { label: "Cancelled", icon: Clock,         color: "#4a5568", bg: "rgba(74,85,104,0.1)" },
  };
  const { label, icon: Icon, color, bg } = cfg[status] ?? cfg.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ color, background: bg }}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
