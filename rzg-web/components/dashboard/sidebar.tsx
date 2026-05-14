"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Bot, Brain, LayoutDashboard, ListTodo, LogOut, Plus, Radio, Terminal, Users } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/command", label: "Command", icon: Terminal, exact: false },
  { href: "/dashboard/agents", label: "AI Workers", icon: Users, exact: false },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListTodo, exact: false },
  { href: "/dashboard/memory", label: "Memory", icon: Brain, exact: false },
];

type SidebarTask = {
  id: string;
  name: string;
  status: string;
  agentName: string;
};

export function Sidebar({
  workspaceName,
  recentTasks = [],
}: {
  workspaceName: string;
  recentTasks?: SidebarTask[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
    <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#030712]/92 p-3 backdrop-blur-xl xl:w-72 md:flex">
      <Link href="/dashboard" className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.07]">
        <div className="brand-mark h-9 w-9">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black tracking-wide text-white">RZG AI</p>
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">Command Center</p>
        </div>
      </Link>

      <div className="mb-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.04] px-3 py-2.5">
        <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100">
          <Radio className="h-3 w-3" />
          Workspace
        </div>
        <p className="truncate text-sm font-bold text-white">{workspaceName}</p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-300">Workers, tasks, memory.</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <nav className="space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link key={href} href={href} className={`nav-item min-h-10 ${active ? "active" : ""}`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.8)]" />}
              </Link>
            );
          })}
        </nav>

        <section className="mt-3 flex min-h-0 flex-1 flex-col border-t border-white/10 pt-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Recent Tasks</p>
            <Link href="/dashboard/tasks" className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-100 hover:text-white">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="min-h-0 max-h-64 flex-1 space-y-1 overflow-y-auto pr-1">
            {recentTasks.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.025] px-2.5 py-2">
                <p className="text-xs font-semibold leading-5 text-slate-300">No missions yet</p>
                <Link href="/dashboard/command" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-cyan-100">
                  Open Command <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              recentTasks.map((task) => {
                const active = pathname === `/dashboard/tasks/${task.id}`;
                return (
                  <Link
                    key={task.id}
                    href={`/dashboard/tasks/${task.id}`}
                    className={`group flex min-w-0 items-start gap-2 rounded-lg border px-2 py-1.5 transition ${
                      active
                        ? "border-cyan-300/30 bg-cyan-300/[0.075]"
                        : "border-transparent bg-white/[0.018] hover:border-white/10 hover:bg-white/[0.045]"
                    }`}
                  >
                    <StatusDot status={task.status} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-bold text-white group-hover:text-cyan-100">{task.name}</span>
                      <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-400">{task.agentName}</span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      <div className="shrink-0 border-t border-white/10 pt-3">
        <Link href="/dashboard/agents/new" className="button-primary mb-2 w-full justify-center px-3 py-2.5 text-sm">
          <Plus className="h-4 w-4" />
          Create Worker
        </Link>
        <button type="button" onClick={signOut} className="button-secondary w-full justify-center px-3 py-2.5 text-sm">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#030712]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      <nav className="grid grid-cols-5 gap-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold ${active ? "bg-cyan-300/10 text-cyan-100" : "text-slate-300"}`}>
              <Icon className="h-4 w-4" />
              <span>{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
    </>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-emerald-300",
    running: "bg-amber-300 animate-pulse-dot",
    failed: "bg-red-300",
    cancelled: "bg-slate-500",
    pending: "bg-slate-500",
  };
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colors[status] ?? colors.pending}`} />;
}
