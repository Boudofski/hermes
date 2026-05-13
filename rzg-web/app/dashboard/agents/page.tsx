import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Bot, Plus, Pencil, Zap } from "lucide-react";

export const metadata = { title: "AI Workers — RZG AI" };

const ACCENT_COLORS = [
  "#3b82f6", "#06b6d4", "#8b5cf6", "#22c55e", "#f59e0b", "#ec4899",
];

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
    <div className="p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#2d4a8a" }}>
            Workforce
          </p>
          <h1 className="text-2xl font-bold text-white">AI Workers</h1>
          <p className="text-sm mt-0.5" style={{ color: "#4a5568" }}>
            {agentList.length} worker{agentList.length !== 1 ? "s" : ""} deployed
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
          style={{ background: "#1d4ed8" }}
        >
          <Plus className="w-4 h-4" />
          New Worker
        </Link>
      </div>

      {agentList.length === 0 ? (
        <div className="rounded-xl p-14 text-center" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" }}>
            <Bot className="w-6 h-6" style={{ color: "#3b82f6" }} />
          </div>
          <p className="text-sm font-semibold text-white mb-1">No AI workers yet</p>
          <p className="text-xs mb-5" style={{ color: "#4a5568", maxWidth: 280, margin: "4px auto 20px" }}>
            Create your first autonomous AI worker to start automating tasks.
          </p>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#1d4ed8" }}
          >
            <Plus className="w-4 h-4" />
            Create AI Worker
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {agentList.map((agent, i) => {
            const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
            return (
              <div
                key={agent.id}
                className="rounded-xl overflow-hidden flex flex-col"
                style={{ background: "#0b0e18", border: "1px solid #1e2640" }}
              >
                {/* Accent strip */}
                <div className="h-0.5 w-full" style={{ background: accent }} />

                <div className="p-5 flex-1 flex flex-col gap-4">
                  {/* Identity */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                        <Bot className="w-4.5 h-4.5" style={{ color: accent }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white leading-tight">{agent.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#4a5568" }}>{agent.role}</p>
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                      style={agent.isActive
                        ? { background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }
                        : { background: "rgba(74,85,104,0.1)", color: "#4a5568", border: "1px solid rgba(74,85,104,0.2)" }
                      }
                    >
                      {agent.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Goal */}
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#4a5568" }}>
                    {agent.goal}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 mt-auto" style={{ borderTop: "1px solid #151c2c" }}>
                    <code className="text-xs px-2 py-0.5 rounded" style={{ background: "#0d1120", color: "#3b82f6", border: "1px solid #1e2640" }}>
                      {agent.model.split("/").pop()}
                    </code>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/agents/${agent.id}`}
                        className="flex items-center gap-1 text-xs transition-colors"
                        style={{ color: "#3a4455" }}
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/tasks?agentId=${agent.id}`}
                        className="flex items-center gap-1 text-xs font-medium transition-colors"
                        style={{ color: accent }}
                      >
                        <Zap className="w-3 h-3" />
                        Run Task
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
