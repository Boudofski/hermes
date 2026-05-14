import { Sidebar } from "@/components/dashboard/sidebar";
import { db } from "@/lib/db";
import { agents, tasks, workspaces } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, user.id)).limit(1);
  const recentTaskRows = workspace
    ? await db
        .select({
          id: tasks.id,
          name: tasks.name,
          status: tasks.status,
          updatedAt: tasks.updatedAt,
          lastRunAt: tasks.lastRunAt,
          agentName: agents.name,
        })
        .from(tasks)
        .innerJoin(agents, eq(tasks.agentId, agents.id))
        .where(eq(tasks.workspaceId, workspace.id))
        .orderBy(desc(tasks.lastRunAt), desc(tasks.updatedAt))
        .limit(5)
    : [];
  const recentTasks = recentTaskRows.map(({ id, name, status, agentName }) => ({ id, name, status, agentName }));

  return (
    <div className="rzg-root min-h-screen w-full overflow-x-hidden md:pl-64 xl:pl-72">
      <Sidebar workspaceName={workspace?.name ?? "AI Operations"} recentTasks={recentTasks} />
      <main className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="rzg-grid-fine pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative min-h-screen min-w-0 max-w-full">{children}</div>
      </main>
    </div>
  );
}
