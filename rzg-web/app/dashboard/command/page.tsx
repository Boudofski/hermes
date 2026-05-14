import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, memories, workspaces } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { PageTitle } from "@/components/ui/page-title";
import { CommandCenterForm } from "@/components/command/command-center-form";
import { Terminal } from "lucide-react";

export const metadata = { title: "Command — RZG AI" };

export default async function CommandPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, user!.id)).limit(1);
  const [workerRows, [memoryCount]] = await Promise.all([
    db
      .select({
        id: agents.id,
        name: agents.name,
        role: agents.role,
        goal: agents.goal,
        model: agents.model,
        memoryEnabled: agents.memoryEnabled,
      })
      .from(agents)
      .where(eq(agents.workspaceId, workspace.id)),
    db.select({ count: count() }).from(memories).where(eq(memories.workspaceId, workspace.id)),
  ]);

  return (
    <div className="min-h-screen min-w-0 max-w-full pb-28 md:pb-0">
      <PageTitle
        eyebrow="Command Center"
        title="Execute a Mission"
        description="Pick a specialized AI worker, describe the outcome, and RZG will create, run, and save the mission automatically."
        action={
          <div className="hidden items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100 sm:flex">
            <Terminal className="h-4 w-4" />
            Primary execution interface
          </div>
        }
      />

      <div className="min-w-0 p-4 sm:p-6 lg:p-8">
        <CommandCenterForm workers={workerRows} memoryCount={memoryCount.count} />
      </div>
    </div>
  );
}
