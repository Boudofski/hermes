import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Bot, Plus, Pencil } from "lucide-react";

export const metadata = { title: "AI Workers" };

export default async function AgentsPage() {
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

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">AI Workers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {agentList.length} worker{agentList.length !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Worker
        </Link>
      </div>

      {agentList.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-4">
          <Bot className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium">No AI workers yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first autonomous AI worker to start automating tasks.
            </p>
          </div>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create AI Worker
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {agentList.map((agent) => (
            <div
              key={agent.id}
              className="bg-card border border-border rounded-xl p-5 space-y-3 hover:border-blue-500/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/15 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-xs ${agent.isActive ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                  {agent.isActive ? "Active" : "Inactive"}
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2">{agent.goal}</p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">{agent.model.split("/").pop()}</span>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/agents/${agent.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/tasks?agentId=${agent.id}`}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Run Task
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
