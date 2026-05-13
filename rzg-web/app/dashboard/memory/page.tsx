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
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xs font-medium text-cyan-400 uppercase tracking-widest">Knowledge Base</p>
        </div>
        <h1 className="text-2xl font-bold">Memory</h1>
        <p className="text-muted-foreground text-sm mt-1">Persistent knowledge for your AI workers</p>
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
