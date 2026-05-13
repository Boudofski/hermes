import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { memories, agents, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Brain } from "lucide-react";
import { MemoryManager } from "@/components/memory/memory-manager";

export const metadata = { title: "Memory — RZG AI" };

export default async function MemoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, user!.id)).limit(1);

  const [memoryList, agentList] = await Promise.all([
    db
      .select({
        id: memories.id,
        key: memories.key,
        content: memories.content,
        agentId: memories.agentId,
        agentName: agents.name,
        createdAt: memories.createdAt,
      })
      .from(memories)
      .leftJoin(agents, eq(memories.agentId, agents.id))
      .where(eq(memories.workspaceId, workspace.id))
      .orderBy(memories.createdAt),

    db
      .select({ id: agents.id, name: agents.name })
      .from(agents)
      .where(eq(agents.workspaceId, workspace.id)),
  ]);

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#0e4a52" }}>
          Knowledge Base
        </p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <Brain className="w-4.5 h-4.5" style={{ color: "#06b6d4" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Memory</h1>
            <p className="text-sm" style={{ color: "#4a5568" }}>Persistent knowledge for your AI workers</p>
          </div>
        </div>
      </div>

      <MemoryManager
        initialMemories={memoryList.map((m) => ({
          ...m,
          createdAt: m.createdAt?.toISOString() ?? null,
        }))}
        agents={agentList}
      />
    </div>
  );
}
