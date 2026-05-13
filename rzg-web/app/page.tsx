import Link from "next/link";
import {
  Bot, ArrowRight, CheckCircle, Zap, Brain, Activity,
  Search, PenLine, TrendingUp, Target, Megaphone,
  Smartphone, ClipboardList, Settings2, type LucideIcon,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  research: Search,
  content: PenLine,
  seo: TrendingUp,
  "competitor-analysis": Target,
  marketing: Megaphone,
  "social-media": Smartphone,
  "proposal-writer": ClipboardList,
  "business-automation": Settings2,
};

const TEMPLATE_ACCENTS = [
  "accent-blue", "accent-violet", "accent-cyan",
  "accent-green", "accent-amber", "accent-pink",
];

const MOCK_WORKERS = [
  { name: "Research Bot",   role: "Senior Research Analyst", status: "running", model: "GPT-4o",      memory: true,  color: "blue"   },
  { name: "Content Writer", role: "Content Specialist",      status: "idle",    model: "Claude 3.5",  memory: true,  color: "violet" },
  { name: "Ops Manager",    role: "Operations Analyst",      status: "queued",  model: "Gemini 2.0",  memory: false, color: "green"  },
] as const;

const MOCK_LOGS = [
  { type: "tool_start", tool: "web_search", text: "Searching: \"AI market size Q2 2025\"" },
  { type: "tool_end",   tool: "web_search", text: "web_search" },
  { type: "tool_start", tool: "read_url",   text: "techcrunch.com/ai-q2-report" },
  { type: "tool_end",   tool: "read_url",   text: "read_url" },
  { type: "text",       tool: null,         text: "Analyzing 14 sources for market data..." },
  { type: "tool_start", tool: "write_file", text: "Drafting executive summary..." },
  { type: "text",       tool: null,         text: "Compiling final Q2 intelligence report..." },
];

const FEATURES = [
  {
    icon: <Zap className="w-5 h-5 text-blue-400" />,
    iconBg: "bg-blue-500/10 border-blue-500/20",
    title: "Deploy in 60 seconds",
    desc: "Pick a specialist template, configure your goal, and launch. Your AI workers run in the cloud — no infrastructure, no setup.",
  },
  {
    icon: <Activity className="w-5 h-5 text-violet-400" />,
    iconBg: "bg-violet-500/10 border-violet-500/20",
    title: "Live execution streaming",
    desc: "Watch every tool call, search query, and reasoning step unfold in real time. Full transparency into what your workers are doing.",
  },
  {
    icon: <Brain className="w-5 h-5 text-cyan-400" />,
    iconBg: "bg-cyan-500/10 border-cyan-500/20",
    title: "Persistent memory layer",
    desc: "Workers remember context across tasks. Store knowledge, preferences, and learned patterns that persist between every run.",
  },
];

const TEMPLATES_SHOWCASE = [
  { id: "research",            name: "Research",      role: "Deep-dives any topic",           color: "blue"   },
  { id: "content",             name: "Content",       role: "Writes long-form content",       color: "violet" },
  { id: "seo",                 name: "SEO",           role: "Audits & finds opportunities",   color: "cyan"   },
  { id: "competitor-analysis", name: "Intel",         role: "Maps the competitive landscape", color: "green"  },
  { id: "marketing",           name: "Marketing",     role: "Plans campaigns & writes copy",  color: "amber"  },
  { id: "social-media",        name: "Social Media",  role: "Platform-native content",        color: "pink"   },
];

const ACCENT_CLS: Record<string, string> = {
  blue:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
  violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  cyan:   "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  green:  "text-green-400 bg-green-500/10 border-green-500/20",
  amber:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  pink:   "text-pink-400 bg-pink-500/10 border-pink-500/20",
};

// ── Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-md bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">RZG AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {["AI Workers", "How It Works", "Templates"].map((item) => (
              <span key={item} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default rounded-lg hover:bg-white/5">
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link href="/login" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Start free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 hero-grid">
        <div className="absolute inset-0 pointer-events-none bg-radial-blue" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/25 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium badge badge-blue mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
            AI Workforce OS · 8 specialist templates ready to deploy
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.07] mb-6">
            Deploy your<br />
            <span className="text-gradient">AI workforce.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10">
            Specialist AI workers that research, write, analyze, and execute — autonomously.
            Watch them work in real time. No infrastructure. No setup.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20"
            >
              Start free — no credit card
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 border border-border hover:border-blue-500/40 text-muted-foreground hover:text-foreground rounded-xl transition-all text-sm"
            >
              Sign in to dashboard
            </Link>
          </div>

          {/* ── Command Center Mockup ── */}
          <CommandCenterMockup />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
            Why teams use RZG AI
          </p>
          <h2 className="text-3xl font-bold">Everything your AI team needs</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel p-6 space-y-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${f.iconBg}`}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Templates ── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Specialist Templates
            </p>
            <h2 className="text-3xl font-bold mb-3">Your AI workforce roster</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Eight pre-built specialist workers with expert-crafted system prompts and optimized model selection.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TEMPLATES_SHOWCASE.map((t, i) => {
              const Icon = TEMPLATE_ICONS[t.id] ?? Bot;
              const cls = ACCENT_CLS[t.color];
              return (
                <div key={t.id} className={`worker-card ${TEMPLATE_ACCENTS[i % TEMPLATE_ACCENTS.length]}`}>
                  <div className="p-5 space-y-3">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${cls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name} Agent</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to deploy your <span className="text-gradient">AI workforce?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Free workspace. First AI worker running in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all text-sm"
            >
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {["No credit card", "8 templates included", "Live streaming"].map((x) => (
                <span key={x} className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">RZG AI</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 RZG AI</p>
        </div>
      </footer>
    </div>
  );
}

// ── Command Center Mockup ─────────────────────────────────────────────

function CommandCenterMockup() {
  return (
    <div className="relative mx-auto rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-[#1e2a45]">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#080c15] border-b border-[#131928]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-0.5 rounded bg-[#0d1120] border border-[#1a2035] w-56">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-xs text-[#4a5568] font-mono">rzg.ai/dashboard</span>
          </div>
        </div>
        <div className="w-16" />
      </div>

      {/* Dashboard shell */}
      <div className="flex h-[440px] bg-[#07090f] text-left overflow-hidden">

        {/* Sidebar */}
        <div className="w-44 shrink-0 border-r border-[#1a2035] flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1a2035]">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-white">RZG AI</span>
          </div>
          <div className="px-2 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5" style={{ color: "#1e2640" }}>
              Workspace
            </p>
          </div>
          <div className="px-2 flex-1 space-y-0.5">
            {[
              { label: "Overview",   active: false },
              { label: "AI Workers", active: true  },
              { label: "Tasks",      active: false },
              { label: "Memory",     active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`px-3 py-2 rounded-lg text-xs ${
                  item.active ? "bg-blue-600/15 text-blue-400 font-medium" : "text-[#3a4455]"
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>
          <div className="px-2 py-3 border-t border-[#1a2035]">
            <div className="px-3 py-1.5 rounded-lg text-[11px] text-[#2d3a52]">Sign out</div>
          </div>
        </div>

        {/* Workers column */}
        <div className="w-60 shrink-0 border-r border-[#1a2035] flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a2035]">
            <span className="text-xs font-semibold text-white">AI Workers</span>
            <span className="badge badge-blue" style={{ fontSize: "10px" }}>3 deployed</span>
          </div>
          <div className="p-3 space-y-2 flex-1 overflow-hidden">
            {MOCK_WORKERS.map((w) => (
              <MockWorkerRow key={w.name} {...w} />
            ))}
          </div>
        </div>

        {/* Execution console */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a2035]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Execution Console</span>
              <span className="text-[10px] text-[#3a4455] font-mono">· Research Bot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
              <span className="text-[10px] text-blue-400 font-mono font-semibold">LIVE</span>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-1.5 overflow-hidden bg-[#050709]">
            {MOCK_LOGS.map((log, i) => (
              <MockLogLine key={i} {...log} />
            ))}
          </div>

          <div className="px-4 py-2.5 border-t border-[#131928] bg-[#06080e] flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
            <span className="text-[10px] text-[#4a5568] font-mono">Iteration 7 / 30</span>
            <span className="ml-auto text-[10px] text-[#2d3a52] font-mono">12.3s elapsed</span>
          </div>
        </div>
      </div>

      {/* Bottom fade for depth */}
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}

function MockWorkerRow({
  name, role, status, model, memory, color,
}: {
  name: string; role: string; status: string;
  model: string; memory: boolean; color: "blue" | "violet" | "green";
}) {
  const statusMap = {
    running: { label: "Running", badge: "badge-green" },
    idle:    { label: "Idle",    badge: "badge-muted" },
    queued:  { label: "Queued",  badge: "badge-yellow" },
  } as const;
  const { label, badge } = statusMap[status as keyof typeof statusMap];
  const iconCls = { blue: "bg-blue-600/20 text-blue-400", violet: "bg-violet-600/20 text-violet-400", green: "bg-green-600/20 text-green-400" }[color];

  return (
    <div className="rounded-lg border border-[#1a2035] bg-[#0d1120] p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">{name}</p>
            <p className="text-[10px] text-[#3a4455] truncate leading-tight">{role}</p>
          </div>
        </div>
        <span className={`badge ${badge} shrink-0`} style={{ fontSize: "10px" }}>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <code className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
          {model}
        </code>
        {memory && (
          <span className="badge badge-cyan" style={{ fontSize: "10px" }}>
            <Brain className="w-2.5 h-2.5" /> Mem
          </span>
        )}
      </div>
    </div>
  );
}

function MockLogLine({ type, tool, text }: { type: string; tool: string | null; text: string }) {
  if (type === "tool_start") return (
    <div className="exec-line">
      <span className="log-sys shrink-0">▶</span>
      <span className="log-tool">{tool}</span>
      <span className="log-sys text-[10px] truncate">{text.replace(tool ?? "", "").trim()}</span>
    </div>
  );
  if (type === "tool_end") return (
    <div className="exec-line">
      <span className="log-sys shrink-0">✓</span>
      <span className="log-done">{tool} complete</span>
    </div>
  );
  return (
    <div className="exec-line">
      <span className="log-sys shrink-0">·</span>
      <span className="log-out">{text}</span>
    </div>
  );
}
