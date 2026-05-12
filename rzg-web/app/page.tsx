import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse-glow" />
          AI Workers. Running now.
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          Your AI Workforce.
          <br />
          <span className="text-blue-400">Running 24/7.</span>
        </h1>

        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Deploy autonomous AI workers for marketing, research, content, SEO,
          and business automation. Hire AI employees that work while you sleep.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors glow-blue"
          >
            Start Building
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border hover:border-blue-500/50 hover:bg-blue-500/5 text-foreground font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
