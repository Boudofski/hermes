import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { memories, agents, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Brain } from "lucide-react";
import { MemoryManager } from "@/components/memory/memory-manager";

export const metadata = { title: "Memory" };

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
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Brain className="w-5 h-5 text-blue-400" />
        <div>
          <h1 className="text-xl font-semibold">Memory</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Persistent knowledge for your AI workers</p>
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
