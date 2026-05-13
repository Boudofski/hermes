import Link from "next/link";
import {
  ArrowRight, Check, Bot, Search, FileText,
  TrendingUp, Target, Megaphone, Settings2,
  Zap, Brain, Layers,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#07090f", color: "#e2e8f0" }}>
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 lg:px-10"
        style={{ background: "rgba(7,9,15,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid #1e2640" }}
      >
        <Link href="/" className="flex items-center gap-2.5 mr-10">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-[15px]">RZG AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "#6b7a95" }}>
          <Link href="#workers" className="hover:text-white transition-colors">AI Workers</Link>
          <Link href="#how" className="hover:text-white transition-colors">How it works</Link>
          <Link href="#why" className="hover:text-white transition-colors">Why RZG</Link>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/login" className="text-sm px-3 py-1.5 rounded-md transition-colors hover:text-white" style={{ color: "#6b7a95" }}>
            Sign in
          </Link>
          <Link href="/register" className="text-sm font-semibold px-4 py-2 rounded-md text-white transition-all glow-blue" style={{ background: "#1d4ed8" }}>
            Start free
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-14 overflow-hidden">
        <div className="absolute inset-0 bg-radial-blue pointer-events-none" />
        <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-24">
          {/* Left */}
          <div>
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-8"
              style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.25)", color: "#60a5fa" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
              Workers executing right now
            </div>

            <h1
              className="font-bold leading-[1.06] tracking-tight mb-6"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: "1.06" }}
            >
              Deploy AI workers.
              <br />
              <span className="text-gradient">Not chatbots.</span>
            </h1>

            <p className="text-lg mb-8 leading-relaxed max-w-lg" style={{ color: "#8b95a7" }}>
              RZG AI gives you autonomous specialists — not assistants. Each worker has a defined role, goal, and
              skill set. They research, write, and execute while you focus on what matters.
            </p>

            <div className="flex items-center gap-4 mb-10">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white text-sm transition-all glow-blue"
                style={{ background: "#1d4ed8" }}
              >
                Start building free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors"
                style={{ color: "#6b7a95", border: "1px solid #1e2640" }}
              >
                Sign in
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                "Autonomous multi-step execution",
                "Live streaming execution logs",
                "Persistent memory across tasks",
                "8 specialist role templates",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm" style={{ color: "#8b95a7" }}>
                  <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Right — product preview */}
          <div className="hidden lg:block">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* ── Workers ─────────────────────────────────────────────────────── */}
      <section id="workers" className="py-24 px-6 lg:px-10" style={{ borderTop: "1px solid #1e2640" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#3b82f6" }}>
              AI Workers
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">One platform. Every specialist.</h2>
            <p className="text-base" style={{ color: "#6b7a95", maxWidth: "480px" }}>
              Purpose-built AI workers with defined roles, goals, and skill sets. Not generic assistants.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {WORKERS.map(({ icon: Icon, label, desc, accent }) => (
              <div
                key={label}
                className="rounded-xl p-5 group transition-all"
                style={{ background: "#0b0e18", border: "1px solid #1e2640" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: accent.bg }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: accent.icon }} />
                </div>
                <p className="font-semibold text-white text-sm mb-1.5">{label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#6b7a95" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-6 lg:px-10" style={{ borderTop: "1px solid #1e2640", background: "#09010d" }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#22d3ee" }}>
            How it works
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-16">Running in under 5 minutes</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative">
                <div
                  className="text-[64px] font-black leading-none mb-4 select-none"
                  style={{ color: "rgba(255,255,255,0.04)", fontVariantNumeric: "tabular-nums" }}
                >
                  {n}
                </div>
                <p className="font-semibold text-white text-sm mb-2">{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#6b7a95" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why different ───────────────────────────────────────────────── */}
      <section id="why" className="py-24 px-6 lg:px-10" style={{ borderTop: "1px solid #1e2640" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#a78bfa" }}>
            Why RZG AI
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">Not a chatbot. A workforce.</h2>
          <p className="text-base mb-14" style={{ color: "#6b7a95", maxWidth: "480px" }}>
            RZG AI workers are autonomous specialists that reason, search, and execute — not just generate text.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {WHY.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 rounded-xl p-5" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#6b7a95" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-10" style={{ borderTop: "1px solid #1e2640", background: "#09010d" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to hire your AI workforce?</h2>
          <p className="text-base mb-8" style={{ color: "#6b7a95" }}>
            Start free. No credit card. Deploy your first worker in minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-white text-sm transition-all glow-blue"
            style={{ background: "#1d4ed8" }}
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 lg:px-10 flex items-center justify-between" style={{ borderTop: "1px solid #1e2640" }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center">
            <Bot className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-bold text-white">RZG AI</span>
        </div>
        <p className="text-xs" style={{ color: "#3a4455" }}>© 2026 RZG AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

/* ── Product preview mockup ─────────────────────────────────────────────── */
function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 rounded-3xl pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(37,99,235,0.12) 0%, transparent 70%)"
      }} />
      <div className="relative rounded-xl overflow-hidden shadow-2xl" style={{ border: "1px solid #1e2640" }}>
        {/* Browser chrome */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#0a0e18", borderBottom: "1px solid #1a2035" }}>
          <div className="flex gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="text-[10px] font-mono px-4 py-1 rounded" style={{ background: "#0d1120", color: "rgba(255,255,255,0.2)" }}>
              rzg.ai/dashboard/tasks/run
            </div>
          </div>
        </div>

        {/* App shell */}
        <div className="flex" style={{ background: "#08010e", minHeight: "380px" }}>
          {/* Mini sidebar */}
          <div className="w-10 shrink-0 flex flex-col items-center py-3 gap-3" style={{ borderRight: "1px solid #1a2035" }}>
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            {[0,1,2,3].map(i => (
              <div key={i} className="w-5 h-5 rounded" style={{ background: i === 1 ? "rgba(37,99,235,0.2)" : "rgba(255,255,255,0.04)" }} />
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="text-xs font-medium text-white/70">Research Agent</div>
              <span
                className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(234,179,8,0.1)", color: "#eab308" }}
              >
                Running
              </span>
            </div>

            {/* Task prompt */}
            <div className="text-[10px] rounded-lg px-3 py-2.5 leading-relaxed" style={{ background: "#0d1120", color: "rgba(255,255,255,0.4)", border: "1px solid #1a2035" }}>
              Analyze the top 5 SaaS competitors in the AI writing space. Compare pricing, features, and positioning...
            </div>

            {/* Console */}
            <div className="rounded-lg overflow-hidden" style={{ background: "#06080e", border: "1px solid #1a2035" }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid #1a2035" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
                <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>execution.log</span>
              </div>
              <div className="p-3 space-y-1.5 font-mono text-[10px]">
                <div style={{ color: "#a78bfa" }}>▶ web_search<span style={{ color: "rgba(255,255,255,0.25)" }}> starting…</span></div>
                <div style={{ color: "#4ade80" }}>✓ web_search</div>
                <div style={{ color: "#a78bfa" }}>▶ web_search<span style={{ color: "rgba(255,255,255,0.25)" }}> starting…</span></div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>• Synthesizing results from 6 sources…</div>
                <div style={{ color: "#4ade80" }}>✓ web_search</div>
                <div className="mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Top competitors identified:<br />
                  <span style={{ color: "#60a5fa" }}>1.</span> Jasper AI — $49/mo, content-first<br />
                  <span style={{ color: "#60a5fa" }}>2.</span> Copy.ai — $49/mo, templates<br />
                  <span style={{ color: "#60a5fa" }}>3.</span> Writesonic — SEO focus…
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse-dot" />
              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Iteration 5 / 30 · 3.2s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Data ───────────────────────────────────────────────────────────────── */
const WORKERS = [
  { icon: Search, label: "Research Agent", desc: "Deep multi-source research with citations and structured reports.", accent: { bg: "rgba(37,99,235,0.12)", icon: "#60a5fa" } },
  { icon: FileText, label: "Content Agent", desc: "Blog posts, articles, and long-form copy optimised for readers.", accent: { bg: "rgba(6,182,212,0.12)", icon: "#22d3ee" } },
  { icon: TrendingUp, label: "SEO Agent", desc: "Keyword research, on-page audits, and prioritised growth plans.", accent: { bg: "rgba(139,92,246,0.12)", icon: "#a78bfa" } },
  { icon: Target, label: "Competitor Analyst", desc: "Market intelligence, positioning gaps, and competitive strategy.", accent: { bg: "rgba(34,197,94,0.12)", icon: "#4ade80" } },
  { icon: Megaphone, label: "Marketing Agent", desc: "Campaigns, copy, and A/B-ready creative across all channels.", accent: { bg: "rgba(249,115,22,0.12)", icon: "#fb923c" } },
  { icon: Settings2, label: "Automation Agent", desc: "Process analysis, workflow design, and automation roadmaps.", accent: { bg: "rgba(236,72,153,0.12)", icon: "#f472b6" } },
];

const STEPS = [
  { n: "01", title: "Choose a template", desc: "Pick from 8 pre-built specialists or define your own role, goal, and instructions." },
  { n: "02", title: "Write your task", desc: "Describe what you need in plain English. The worker figures out how to do it." },
  { n: "03", title: "Watch it execute", desc: "Live-streaming logs show every step. Results delivered directly in the console." },
];

const WHY = [
  { icon: Zap, title: "Real tool use", desc: "Workers use web search, multi-step reasoning, and tool calls — not just text generation." },
  { icon: Brain, title: "Persistent memory", desc: "Workers remember context across tasks and learn about your business over time." },
  { icon: Bot, title: "Defined specialists", desc: "Each worker has a role, goal, and skill set. Not a blank-slate assistant." },
  { icon: Layers, title: "Full observability", desc: "Every reasoning step and tool call streamed live. No black box." },
];
