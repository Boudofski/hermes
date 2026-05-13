import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { memories, agents, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Brain, Database, LockKeyhole } from "lucide-react";
import { MemoryManager } from "@/components/memory/memory-manager";
import { PageTitle } from "@/components/ui/page-title";

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

    db.select({ id: agents.id, name: agents.name }).from(agents).where(eq(agents.workspaceId, workspace.id)),
  ]);

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <PageTitle
        eyebrow="Memory Vault"
        title="Persistent Knowledge"
        description="Store durable context for all workers or attach specific memories to individual AI employees."
      />

      <div className="grid gap-6 p-5 sm:p-8 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="surface-card p-5">
            <div className="brand-mark mb-4 h-12 w-12"><Brain className="h-6 w-6" /></div>
            <h2 className="text-xl font-bold text-white">Memory layer</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Global memories are available across the workspace. Worker-specific memories focus a single AI employee.
            </p>
          </div>
          <div className="metal-panel p-5">
            <Database className="mb-4 h-7 w-7 text-cyan-200" />
            <p className="font-bold text-white">{memoryList.length} saved entries</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Every entry here comes from your database, not generated sample data.</p>
          </div>
          <div className="metal-panel p-5">
            <LockKeyhole className="mb-4 h-7 w-7 text-cyan-200" />
            <p className="font-bold text-white">Operational context</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Use memory for preferences, brand voice, project facts, constraints, and reusable instructions.</p>
          </div>
        </aside>

        <MemoryManager
          initialMemories={memoryList.map((m) => ({
            ...m,
            createdAt: m.createdAt?.toISOString() ?? null,
          }))}
          agents={agentList}
        />
      </div>
    </div>
  );
}
