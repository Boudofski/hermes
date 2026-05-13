"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Bot, ListTodo, Brain, LogOut } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/agents", label: "AI Workers", icon: Bot, exact: false },
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
    <aside
      className="w-52 shrink-0 flex flex-col h-screen sticky top-0"
      style={{ background: "#07090f", borderRight: "1px solid #1a2035" }}
    >
      {/* Logo */}
      <div className="px-4 h-13 flex items-center" style={{ borderBottom: "1px solid #1a2035" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 py-3.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">RZG AI</span>
        </Link>
      </div>

      {/* Nav section label */}
      <div className="px-4 pt-5 pb-1.5">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d3a52" }}>
          Workspace
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
              style={active
                ? { background: "rgba(37,99,235,0.12)", color: "#60a5fa" }
                : { color: "#4a5568" }
              }
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = "#8b95a7"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = "#4a5568"; (e.currentTarget as HTMLElement).style.background = ""; } }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className={active ? "font-medium" : ""}>{label}</span>
              {active && (
                <span className="ml-auto w-1 h-3.5 rounded-full" style={{ background: "#3b82f6", opacity: 0.7 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid #1a2035" }}>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "#3a4455" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#8b95a7"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#3a4455"; (e.currentTarget as HTMLElement).style.background = ""; }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
