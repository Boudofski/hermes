import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Bot, Plus, Pencil, ArrowRight, Zap } from "lucide-react";

export const metadata = { title: "AI Workers — RZG AI" };

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
    <div className="p-6 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-blue-400 uppercase tracking-widest mb-1">Workforce</p>
          <h1 className="text-2xl font-bold">AI Workers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {agentList.length} worker{agentList.length !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all glow-blue"
        >
          <Plus className="w-4 h-4" />
          New Worker
        </Link>
      </div>

      {agentList.length === 0 ? (
        <div className="glass rounded-2xl p-14 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
            <Bot className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <p className="font-semibold">No AI workers yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Create your first autonomous AI worker to start automating tasks.
            </p>
          </div>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all"
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
              className="glass rounded-2xl p-5 space-y-4 hover:border-blue-500/25 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{agent.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    agent.isActive
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-white/5 text-muted-foreground border border-white/8"
                  }`}
                >
                  {agent.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{agent.goal}</p>

              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                  {agent.model.split("/").pop()}
                </span>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/dashboard/agents/${agent.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/tasks?agentId=${agent.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors font-medium"
                  >
                    <Zap className="w-3 h-3" />
                    Run Task
                    <ArrowRight className="w-3 h-3" />
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
