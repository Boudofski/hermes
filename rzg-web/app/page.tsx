import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  FileText,
  Globe2,
  Megaphone,
  PenLine,
  Radio,
  Repeat2,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  Wrench,
  Workflow,
  Zap,
} from "lucide-react";
import { OrbitalBackground } from "@/components/ui/orbital-background";

const workerCategories = [
  { icon: Search, title: "Research", description: "Market scans, source synthesis, competitive intelligence." },
  { icon: TrendingUp, title: "SEO", description: "Audits, keyword maps, content briefs, search opportunities." },
  { icon: PenLine, title: "Content", description: "Long-form drafts, rewrites, campaign assets, tone systems." },
  { icon: Megaphone, title: "Sales", description: "Prospecting research, outreach prep, account summaries." },
  { icon: Settings2, title: "Operations", description: "Repeatable workflows, document analysis, task automation." },
  { icon: Target, title: "Strategy", description: "Decision memos, positioning, planning, opportunity maps." },
];

const howItWorks = [
  ["01", "Hire a worker", "Choose a specialist template or define a custom role, goal, model, and memory behavior."],
  ["02", "Assign a mission", "Create a task with real instructions and route it to the worker best suited for the job."],
  ["03", "Watch execution", "See live logs, tool calls, generated text, failures, and final output in one console."],
  ["04", "Store knowledge", "Save reusable context in memory so future workers have durable operational knowledge."],
];

const differences = [
  { icon: Radio, title: "Transparent execution", text: "RZG AI shows the work, not just the answer: logs, tool calls, state, and output." },
  { icon: Brain, title: "Persistent memory", text: "Workers can retain business context across tasks through a dedicated memory vault." },
  { icon: ShieldCheck, title: "Business-grade structure", text: "Workers, tasks, results, and audit trails are organized for repeatable operations." },
];

const engineCapabilities = [
  { icon: Brain, title: "Persistent memory", text: "Workers can reuse brand voice, customer context, offers, SOPs, and prior knowledge across tasks." },
  { icon: Terminal, title: "Live execution logs", text: "RZG shows execution as it happens, including streaming output and operational events." },
  { icon: Wrench, title: "Tool-capable workers", text: "Hermes is built for agents that can use tools. RZG exposes this as worker capability, not a chat prompt." },
  { icon: Repeat2, title: "Repeatable workflows", text: "Workers, tasks, outputs, and memory make business processes reusable instead of one-off chats." },
  { icon: Workflow, title: "Future scheduling", text: "Hermes supports scheduled automations; RZG marks scheduling as coming soon where UI wiring is not complete." },
];

const workflowPreview = [
  { icon: Globe2, title: "Website Audit", text: "Fetch a URL, parse SEO structure, and produce prioritized conversion, trust, and accessibility fixes." },
  { icon: Search, title: "Competitor Intelligence", text: "Compare 2-5 competitor URLs and extract positioning gaps, offer opportunities, and next actions." },
  { icon: FileText, title: "Proposal Builder", text: "Turn client briefs plus business memory into client-ready scope, timeline, deliverables, and next steps." },
];

const pricingPlans = [
  { name: "Free", price: "$0", cta: "Start Free", href: "/register", detail: "Limited missions, basic workers, and saved task history while you validate workflows." },
  { name: "Pro", price: "Coming soon", cta: "Join Waitlist", href: "/register", detail: "More missions, business memory, exports, and premium operational workflows." },
  { name: "Agency", price: "Coming soon", cta: "Join Waitlist", href: "/register", detail: "Team workflows, advanced automations, priority models, and client delivery systems." },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const commandHref = user ? "/dashboard/command" : "/register";

  return (
    <main className="rzg-root overflow-hidden">
      <section className="relative min-h-screen border-b border-white/10">
        <OrbitalBackground />
        <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#02050b]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="brand-mark h-9 w-9">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black tracking-wide text-white">RZG AI</p>
                <p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200 sm:block">
                  Workforce Command
                </p>
              </div>
            </Link>
            <div className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex">
              <a href="#workers" className="hover:text-white">Workers</a>
              <a href="#operations" className="hover:text-white">Operations</a>
              <a href="#memory" className="hover:text-white">Memory</a>
            </div>
            <div className="flex items-center gap-2">
              <Link href={user ? "/dashboard/command" : "/login"} className="button-secondary hidden px-3 py-2 sm:inline-flex">
                {user ? "Command Center" : "Sign in"}
              </Link>
              <Link href={commandHref} className="button-primary px-3 py-2">
                {user ? "Open" : "Start Free"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:pt-24">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-200 animate-pulse-dot" />
              AI Workforce Command Center
            </div>
            <h1 className="text-balance text-5xl font-black leading-[0.96] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Deploy AI Workers That Execute Real Business Tasks
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              RZG AI lets businesses create AI employees for research, SEO, content, sales, operations, and automation.
              Assign missions, watch live execution, save results, and build persistent memory.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={commandHref} className="button-primary px-6 py-3">
                {user ? "Open Command Center" : "Start Free"} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#workflows" className="button-secondary px-6 py-3">
                See Workflows <Workflow className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-5">
              <Link href={user ? "/dashboard/agents/new" : "/register"} className="inline-flex items-center gap-2 text-sm font-bold text-cyan-100 hover:text-white">
                Create AI Worker <Bot className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {["Live SSE", "Memory Vault", "Real Tasks"].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-bold text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <ProductMockup />
        </div>
      </section>

      <section id="workflows" className="border-y border-white/10 bg-white/[0.02] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="eyebrow">Workflow Library</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Real operational workflows, not one-off chat prompts.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              RZG creates missions, runs workers, streams execution, saves outputs, and uses business memory for better proposals, audits, content, and strategy.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {workflowPreview.map(({ icon: Icon, title, text }) => (
              <div key={title} className="surface-card surface-card-hover p-6">
                <div className="brand-mark mb-5 h-11 w-11"><Icon className="h-5 w-5" /></div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workers" className="relative px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="eyebrow">AI Worker Categories</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Hire specialists for the workflows your team repeats every week.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workerCategories.map(({ icon: Icon, title, description }) => (
              <div key={title} className="surface-card surface-card-hover p-6">
                <div className="brand-mark mb-5 h-11 w-11">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="eyebrow">Why Not ChatGPT?</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Chat answers questions. RZG runs business missions.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Your team needs repeatable workers, live execution logs, saved mission history, exportable outputs, and memory that compounds across client work.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Saved mission history", "Every command becomes a task with prompt, run logs, final output, and audit trail."],
              ["Business memory", "Store brand voice, services, pricing, target clients, competitors, SOPs, and offer positioning."],
              ["Operational pipelines", "Website audits, competitor intelligence, and proposals use preflight logic before generation."],
            ].map(([title, text]) => (
              <div key={title} className="metal-panel p-6">
                <h3 className="font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="eyebrow">Pricing</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
              Start with missions. Upgrade when your workflows scale.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="surface-card p-6">
                <p className="eyebrow">{plan.name}</p>
                <p className="mt-4 text-3xl font-black text-white">{plan.price}</p>
                <p className="mt-3 min-h-20 text-sm leading-6 text-slate-300">{plan.detail}</p>
                <Link href={user ? "/dashboard/command" : plan.href} className={plan.name === "Free" ? "button-primary mt-6 w-full" : "button-secondary mt-6 w-full"}>
                  {user ? "Open Command Center" : plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-sm font-semibold text-slate-300">Billing is not enabled yet. Current workspace usage is tracked in the dashboard.</p>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="eyebrow">Hermes Agent Engine</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Powered by an agent engine, not a chat box.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              RZG AI is a business layer on top of Hermes: persistent memory, live execution, tool-capable workers,
              repeatable workflows, and scheduling paths that can become durable automations.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {engineCapabilities.map(({ icon: Icon, title, text }) => (
              <div key={title} className="surface-card p-5">
                <div className="brand-mark mb-4 h-10 w-10">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="operations" className="border-y border-white/10 bg-white/[0.02] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1fr] lg:items-start">
            <div>
              <p className="eyebrow">How It Works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
                From worker design to final output, every step is visible.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-300">
                RZG AI is built around real execution surfaces: workers, assigned tasks, live logs, final results, and memory.
              </p>
            </div>
            <div className="grid gap-3">
              {howItWorks.map(([step, title, text]) => (
                <div key={step} className="metal-panel flex gap-5 p-5">
                  <span className="font-mono text-sm font-black text-cyan-200">{step}</span>
                  <div>
                    <h3 className="font-bold text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="memory" className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="eyebrow">Why RZG AI Is Different</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
              Not a chat window. A workforce operating system.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {differences.map(({ icon: Icon, title, text }) => (
              <div key={title} className="surface-card p-7">
                <Icon className="h-7 w-7 text-cyan-200" />
                <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/10 px-5 py-24 text-center sm:px-8">
        <OrbitalBackground dense />
        <div className="relative mx-auto max-w-4xl">
          <p className="eyebrow">Ready for command</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Build your AI workforce today.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Create workers, run missions, inspect execution, and preserve knowledge in one premium operations layer.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={commandHref} className="button-primary px-6 py-3">
              {user ? "Open Command Center" : "Start Free"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={user ? "/dashboard" : "/login"} className="button-secondary px-6 py-3">
              {user ? "Open Dashboard" : "Sign in"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProductMockup() {
  const workers = [
    ["Research Lead", "Analyzing 18 sources", "active"],
    ["SEO Operator", "Keyword map queued", "ready"],
    ["Content Strategist", "Draft complete", "done"],
  ];
  const logs = [
    ["tool", "web_search", "querying competitor pricing pages"],
    ["tool", "read_url", "extracting structured claims"],
    ["text", "analysis", "ranking opportunities by impact"],
    ["done", "report", "executive brief saved"],
  ];

  return (
    <div className="shadow-command scan-line relative overflow-hidden rounded-3xl border border-cyan-200/20 bg-[#050914]">
      <div className="console-header">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-300" />
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-xs text-slate-300">
          rzg.ai / workforce-command
        </div>
        <Radio className="h-4 w-4 text-cyan-200" />
      </div>
      <div className="grid min-h-[520px] gap-px bg-white/10 lg:grid-cols-[220px_1fr]">
        <aside className="bg-[#060b14] p-4">
          <div className="mb-5 flex items-center gap-3">
            <div className="brand-mark h-9 w-9"><Bot className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-black text-white">Command</p>
              <p className="text-[11px] font-semibold text-slate-400">3 workers online</p>
            </div>
          </div>
          <div className="space-y-3">
            {workers.map(([name, detail, state]) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-bold text-white">{name}</p>
                  <span className={`h-2 w-2 rounded-full ${state === "active" ? "bg-cyan-200 animate-pulse-dot" : state === "done" ? "bg-emerald-300" : "bg-slate-400"}`} />
                </div>
                <p className="mt-1 truncate text-[11px] text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </aside>
        <div className="bg-[#03070d] p-5">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Workers", "12"],
              ["Tasks", "48"],
              ["Memories", "216"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                <p className="mt-2 font-mono text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
            <div className="console-shell">
              <div className="console-header">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-cyan-200" />
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-200">Execution Console</span>
                </div>
                <span className="badge badge-blue"><span className="h-1.5 w-1.5 rounded-full bg-cyan-200 animate-pulse-dot" /> Live</span>
              </div>
              <div className="console-body space-y-2 p-4">
                {logs.map(([type, tool, text]) => (
                  <div key={`${tool}-${text}`} className="exec-line">
                    <span className={type === "done" ? "text-emerald-200" : type === "tool" ? "text-cyan-200" : "text-slate-400"}>
                      {type === "done" ? "✓" : type === "tool" ? "▶" : "•"}
                    </span>
                    <span className="text-slate-100">{tool}</span>
                    <span className="text-slate-400">{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.035] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-cyan-200" />
                <h3 className="font-bold text-white">Memory Layer</h3>
              </div>
              {["Brand voice: concise enterprise", "ICP: operations teams", "Output: cite sources"].map((item) => (
                <div key={item} className="mb-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-slate-200">
                  {item}
                </div>
              ))}
              <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Result saved to task archive
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
