import Link from "next/link";
import {
  ArrowRight, Bot, Zap, Brain, Search, FileText,
  TrendingUp, Target, Megaphone, Settings2,
  CheckCircle, ChevronRight, Layers,
} from "lucide-react";

const FEATURES = [
  { icon: Search, label: "Deep Research", desc: "Multi-source web research synthesized into structured reports with citations.", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: FileText, label: "Content Creation", desc: "Blog posts, articles, landing page copy, and long-form marketing content.", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: TrendingUp, label: "SEO Optimization", desc: "Keyword research, on-page audits, and prioritized growth recommendations.", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Target, label: "Competitor Analysis", desc: "Market intelligence, positioning insights, and competitive gap mapping.", color: "text-green-400", bg: "bg-green-500/10" },
  { icon: Megaphone, label: "Marketing Strategy", desc: "Campaigns, copy, channel plans, and A/B-ready creative variations.", color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: Settings2, label: "Business Automation", desc: "Process analysis, workflow design, and ROI-backed automation roadmaps.", color: "text-pink-400", bg: "bg-pink-500/10" },
];

const STEPS = [
  { n: "01", title: "Choose a template", desc: "Pick from 8+ pre-built AI worker templates or define your own specialist from scratch." },
  { n: "02", title: "Write your task", desc: "Describe what you need in plain English. No prompt engineering expertise required." },
  { n: "03", title: "Watch it execute", desc: "Your AI worker runs autonomously and streams every reasoning step back to you live." },
];

const WHY = [
  { icon: Zap, title: "Real autonomy", desc: "Workers use web search, multi-step reasoning, and tool calls — not just text generation." },
  { icon: Brain, title: "Persistent memory", desc: "Workers remember context across tasks and get smarter about your business over time." },
  { icon: Bot, title: "Specialized roles", desc: "Each worker has a defined role, goal, and skill set — not a one-size-fits-all chatbot." },
  { icon: Layers, title: "Full transparency", desc: "Watch every tool call and reasoning step live as it happens. No black box." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">
              RZG <span className="text-blue-400">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-medium px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-grid pt-36 pb-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/6 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/8 blur-3xl rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/8 text-blue-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-glow" />
            AI Workers. Running now.
            <ChevronRight className="w-3 h-3 opacity-50" />
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Your AI Workforce.
            <br />
            <span className="gradient-text">Running 24/7.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Deploy autonomous AI workers for research, content, SEO, and business
            automation. Hire AI specialists that work while you sleep.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all glow-blue text-sm"
            >
              Start Building Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 text-foreground font-medium transition-all text-sm"
            >
              Sign In to Dashboard
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              8+ worker templates
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              Live execution streaming
            </span>
          </div>
        </div>
      </section>

      {/* AI Workers grid */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">AI Workers</p>
            <h2 className="text-3xl sm:text-4xl font-bold">One platform. Every specialist.</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm leading-relaxed">
              Deploy AI workers with specialized roles, goals, and skill sets — purpose-built for your exact use case.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, label, desc, color, bg }) => (
              <div key={label} className="glass rounded-2xl p-6 hover:border-blue-500/20 transition-all group">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-sm mb-2">{label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Deploy in minutes</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-10">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative">
                <div className="text-6xl font-black text-white/4 mb-4 leading-none select-none">{n}</div>
                <h3 className="font-semibold text-sm mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why different */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Why RZG AI</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Not a chatbot. A workforce.</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm leading-relaxed">
              RZG AI workers are autonomous specialists, not general-purpose assistants.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {WHY.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to build your AI workforce?
          </h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Start with a free account. Deploy your first AI worker in under 5 minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all glow-blue"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold">RZG <span className="text-blue-400">AI</span></span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 RZG AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
