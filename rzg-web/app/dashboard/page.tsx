import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { agents, memories, tasks, taskRuns, workspaces } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import Link from "next/link";
import { ArrowRight, Bot, Brain, CheckCircle2, Clock3, FileText, Globe2, ListTodo, Plus, Radio, Search, Target, Wrench, Zap } from "lucide-react";
import { CommandButton } from "@/components/ui/command-button";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageTitle } from "@/components/ui/page-title";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata = { title: "Dashboard — RZG AI" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.ownerId, user!.id)).limit(1);

  const [[agentCount], [taskCount], [memoryCount], runStatuses, recentRuns] = await Promise.all([
    db.select({ count: count() }).from(agents).where(eq(agents.workspaceId, workspace.id)),
    db.select({ count: count() }).from(tasks).where(eq(tasks.workspaceId, workspace.id)),
    db.select({ count: count() }).from(memories).where(eq(memories.workspaceId, workspace.id)),
    db.select({ status: taskRuns.status })
      .from(taskRuns)
      .innerJoin(tasks, eq(taskRuns.taskId, tasks.id))
      .where(eq(tasks.workspaceId, workspace.id)),
    db.select({
      id: taskRuns.id,
      status: taskRuns.status,
      startedAt: taskRuns.startedAt,
      completedAt: taskRuns.completedAt,
      createdAt: taskRuns.createdAt,
      taskId: taskRuns.taskId,
      taskName: tasks.name,
      agentName: agents.name,
      inputPrompt: taskRuns.inputPrompt,
    })
      .from(taskRuns)
      .innerJoin(tasks, eq(taskRuns.taskId, tasks.id))
      .innerJoin(agents, eq(tasks.agentId, agents.id))
      .where(eq(tasks.workspaceId, workspace.id))
      .orderBy(desc(taskRuns.createdAt))
      .limit(8),
  ]);

  const completedRuns = runStatuses.filter((r) => r.status === "completed").length;
  const runningRuns = runStatuses.filter((r) => r.status === "running").length;
  const failedRuns = runStatuses.filter((r) => r.status === "failed").length;
  const hasWorkers = agentCount.count > 0;
  const hasTasks = taskCount.count > 0;
  const hasMemories = memoryCount.count > 0;

  return (
    <div className="min-h-screen min-w-0 max-w-full pb-28 md:pb-0">
      <PageTitle
        eyebrow="Command Center"
        title="Operations Overview"
        description={`${workspace.name} workspace. Your operational home for workers, missions, memory, and execution results.`}
        action={
          <div className="flex flex-wrap gap-2">
            <CommandButton href="/dashboard/command">
              <Zap className="h-4 w-4" />
              Execute Mission
            </CommandButton>
            <Link href="/dashboard/agents/new" className="button-secondary px-4 py-2.5">
              <Plus className="h-4 w-4" />
              New Worker
            </Link>
          </div>
        }
      />

      <div className="grid min-w-0 gap-6 p-4 sm:p-6 lg:p-8 2xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
        <section className="min-w-0 space-y-6">
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Total Workers" value={agentCount.count} icon={<Bot className="h-5 w-5" />} detail="AI employees deployed in this workspace." />
            <MetricCard label="Total Tasks" value={taskCount.count} icon={<ListTodo className="h-5 w-5" />} detail="Business missions assigned to workers." />
            <MetricCard label="Completed Runs" value={completedRuns} icon={<CheckCircle2 className="h-5 w-5" />} detail="Successful executions across this workspace." />
            <MetricCard label="Failed Runs" value={failedRuns} icon={<Radio className="h-5 w-5" />} detail="Runs that need review or retry." />
            <MetricCard label="Memories" value={memoryCount.count} icon={<Brain className="h-5 w-5" />} detail="Persistent context entries in the vault." />
          </div>

          <section className="surface-panel p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Operational Status</p>
                <h2 className="mt-1 text-xl font-bold text-white">Engine readiness</h2>
              </div>
              <span className="badge badge-blue self-start sm:self-auto">Configured</span>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SystemTile title="Backend adapter" detail="Hermes API endpoint configured for task execution." status="Configured" icon={<Radio className="h-5 w-5" />} />
              <SystemTile title="Memory status" detail={hasMemories ? "Business memory is available for enabled workers." : "No memory entries yet."} status={hasMemories ? "Ready" : "Needs memory"} icon={<Brain className="h-5 w-5" />} />
              <SystemTile title="Active workflows" detail={`${runningRuns} currently running from real task run data.`} status={runningRuns > 0 ? "Live" : "Idle"} icon={<Zap className="h-5 w-5" />} />
              <SystemTile title="Engine capabilities" detail="Streaming, memory, tool events, and operational worker pipelines." status="Enabled" icon={<Wrench className="h-5 w-5" />} />
            </div>
          </section>

          <div className="surface-panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">Recent Task Activity</p>
                <h2 className="mt-1 text-xl font-bold text-white">Execution feed</h2>
              </div>
              <Link href="/dashboard/tasks" className="button-secondary px-3 py-2">
                All tasks <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {recentRuns.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Zap className="h-7 w-7" />}
                  title="No executions yet"
                  description="Create an AI worker and run a task. Live runs and saved results will appear here."
                  action={
                    agentCount.count === 0 ? (
                      <CommandButton href="/dashboard/agents/new"><Plus className="h-4 w-4" /> Create your first worker</CommandButton>
                    ) : (
                      <CommandButton href="/dashboard/command"><Zap className="h-4 w-4" /> Run a task</CommandButton>
                    )
                  }
                />
              </div>
            ) : (
              <div className="min-w-0">
                {recentRuns.map((run) => (
                  <Link key={run.id} href={`/dashboard/tasks/${run.taskId}`} className="activity-row group">
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                    <RunDot status={run.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white group-hover:text-cyan-100">{run.taskName}</p>
                      <p className="mt-1 truncate text-xs text-slate-300">{run.agentName} · {run.inputPrompt}</p>
                    </div>
                    </div>
                    <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end sm:text-right">
                      <StatusBadge status={run.status} />
                      <p className="text-xs font-medium text-slate-300 sm:mt-2">
                        {run.startedAt ? new Date(run.startedAt).toLocaleDateString() : new Date(run.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <section className="surface-panel p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Workflow Library</p>
                <h2 className="mt-1 text-xl font-bold text-white">Operational playbooks</h2>
              </div>
              <Link href="/dashboard/agents/new" className="button-secondary px-3 py-2">
                Create from template <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid min-w-0 gap-3 xl:grid-cols-3">
              <WorkflowCard
                icon={<Globe2 className="h-5 w-5" />}
                title="Website Audit"
                input="One public website URL"
                action="Fetches the site, parses SEO structure, headings, links, and image alt signals."
                output="Prioritized audit with SEO, conversion, accessibility, and trust recommendations."
              />
              <WorkflowCard
                icon={<Search className="h-5 w-5" />}
                title="Competitor Intelligence"
                input="2-5 competitor URLs"
                action="Fetches competitor pages and extracts positioning, CTAs, headings, and metadata."
                output="Competitor matrix, gaps, opportunities, differentiation strategy, and next actions."
              />
              <WorkflowCard
                icon={<FileText className="h-5 w-5" />}
                title="Client Proposal"
                input="Client brief plus business memory"
                action="Reads the brief, loads services/pricing/brand voice memory, and structures an offer."
                output="Client-ready proposal with scope, timeline, deliverables, pricing placeholders, and closing."
              />
            </div>
          </section>

          <section className="surface-panel p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Hermes Engine</p>
                <h2 className="mt-1 text-xl font-bold text-white">Real agent capabilities under the hood</h2>
              </div>
              <span className="badge badge-blue self-start sm:self-auto">Powered by Hermes</span>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <EngineCard icon={<Radio className="h-5 w-5" />} title="Live execution" detail="Streaming task runs and logs." status="Active" />
              <EngineCard icon={<Wrench className="h-5 w-5" />} title="Tool-ready workers" detail="Hermes supports tool-capable agents." status="Engine-ready" />
              <EngineCard icon={<Brain className="h-5 w-5" />} title="Persistent memory" detail="Saved context for workers." status="Active" />
              <EngineCard icon={<Clock3 className="h-5 w-5" />} title="Scheduled workflows" detail="Repeatable automations are planned for RZG." status="Coming soon" muted />
              <EngineCard icon={<Bot className="h-5 w-5" />} title="Multi-model support" detail="Workers store model profiles." status="Engine-ready" />
            </div>
          </section>
        </section>

        <aside className="min-w-0 space-y-6">
          <div className="surface-card p-5">
            <p className="eyebrow">Suggested Next Actions</p>
            <div className="mt-4 space-y-3">
              {!hasMemories && <QuickLaunch href="/dashboard/memory" icon={<Brain className="h-5 w-5" />} title="Add business memory" detail="Store services, pricing, brand voice, SOPs, and positioning." />}
              {!hasWorkers && <QuickLaunch href="/dashboard/agents/new" icon={<Bot className="h-5 w-5" />} title="Create Proposal Builder Worker" detail="Start with a worker that turns briefs into client-ready proposals." />}
              {!hasTasks && <QuickLaunch href="/dashboard/command" icon={<Zap className="h-5 w-5" />} title="Run first mission" detail="Command a worker and watch the execution stream." />}
              <QuickLaunch href="/dashboard/agents/new" icon={<Globe2 className="h-5 w-5" />} title="Run Website Audit" detail="Create or select the audit worker and submit a public URL." />
              <QuickLaunch href="/dashboard/agents/new" icon={<Target className="h-5 w-5" />} title="Compare competitors" detail="Use Competitor Intelligence with 2-5 competitor URLs." />
            </div>
          </div>

          <div className="metal-panel p-5">
            <p className="eyebrow">System Summary</p>
            <div className="mt-4 space-y-3">
              <SystemRow label="Backend adapter" status="configured" />
              <SystemRow label="Live streaming" status="ready" />
              <SystemRow label="Memory layer" status={memoryCount.count > 0 ? "ready" : "idle"} />
              <SystemRow label="Running tasks" value={runningRuns} status={runningRuns > 0 ? "live" : "idle"} />
              <SystemRow label="Recent failures" value={failedRuns} status={failedRuns > 0 ? "failed" : "ready"} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SystemTile({ icon, title, detail, status }: { icon: React.ReactNode; title: string; detail: string; status: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="brand-mark h-9 w-9">{icon}</div>
        <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-[11px] font-bold text-cyan-100">{status}</span>
      </div>
      <p className="truncate font-bold text-white">{title}</p>
      <p className="mt-1 break-words text-xs leading-5 text-slate-300">{detail}</p>
    </div>
  );
}

function EngineCard({ icon, title, detail, status, muted }: { icon: React.ReactNode; title: string; detail: string; status: string; muted?: boolean }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className={muted ? "mb-3 text-slate-300" : "brand-mark mb-3 h-10 w-10"}>{icon}</div>
      <p className="truncate font-bold text-white">{title}</p>
      <p className="mt-1 min-h-10 break-words text-xs leading-5 text-slate-300">{detail}</p>
      <span className={`mt-3 inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${muted ? "border-slate-500/30 bg-slate-500/10 text-slate-300" : "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"}`}>
        {status}
      </span>
    </div>
  );
}

function QuickLaunch({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-300/10">
      <div className="brand-mark h-11 w-11 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-white">{title}</p>
        <p className="mt-1 break-words text-xs leading-5 text-slate-300">{detail}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}

function WorkflowCard({ icon, title, input, action, output }: { icon: React.ReactNode; title: string; input: string; action: string; output: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.06]">
      <div className="mb-4 flex items-center gap-3">
        <div className="brand-mark h-10 w-10">{icon}</div>
        <h3 className="min-w-0 truncate text-base font-black text-white">{title}</h3>
      </div>
      <InfoLine label="Input" value={input} />
      <InfoLine label="RZG does" value={action} />
      <InfoLine label="Output" value={output} />
      <Link href="/dashboard/agents/new" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-100 hover:text-white">
        Start workflow <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-xs leading-5 text-slate-200">{value}</p>
    </div>
  );
}

function SystemRow({ label, status, value }: { label: string; status: string; value?: number }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3">
      <span className="min-w-0 break-words text-sm font-semibold text-slate-200">{label}</span>
      <div className="flex items-center gap-2">
        {typeof value === "number" && <span className="font-mono text-sm font-bold text-white">{value}</span>}
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function RunDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-emerald-300",
    running: "bg-amber-300 animate-pulse-dot",
    failed: "bg-red-300",
    cancelled: "bg-slate-500",
    pending: "bg-slate-500",
  };
  return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors[status] ?? colors.pending}`} />;
}
