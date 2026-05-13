"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bot, Brain, LayoutDashboard, ListTodo, LogOut, Radio, Users } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/agents", label: "AI Workers", icon: Users, exact: false },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListTodo, exact: false },
  { href: "/dashboard/memory", label: "Memory", icon: Brain, exact: false },
];

export function Sidebar() {
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
    <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#030712]/90 p-4 backdrop-blur-xl xl:w-72 md:flex">
      <Link href="/dashboard" className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="brand-mark h-11 w-11">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-black tracking-wide text-white">RZG AI</p>
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">Command Center</p>
        </div>
      </Link>

      <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.045] p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
          <Radio className="h-3.5 w-3.5" />
          Workspace
        </div>
        <p className="text-sm font-bold text-white">AI Operations</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">Workers, tasks, memory, and execution streams.</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {active && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.8)]" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 pt-4">
        <Link href="/dashboard/agents/new" className="button-primary mb-3 w-full">
          <Bot className="h-4 w-4" />
          Create Worker
        </Link>
        <button type="button" onClick={signOut} className="button-secondary w-full justify-start">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#030712]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      <nav className="grid grid-cols-4 gap-1">
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
