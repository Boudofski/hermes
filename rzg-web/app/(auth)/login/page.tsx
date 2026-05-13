"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Bot, Brain, CheckCircle2, Radio, Terminal, Zap } from "lucide-react";
import { OrbitalBackground } from "@/components/ui/orbital-background";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="rzg-root relative grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <OrbitalBackground dense />
      <AuthShowcase eyebrow="Secure command access" title="Return to your AI workforce." />

      <section className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="brand-mark h-9 w-9"><Bot className="h-5 w-5" /></div>
            <span className="text-sm font-black text-white">RZG AI</span>
          </Link>

          <div className="surface-panel p-6 sm:p-8">
            <p className="eyebrow mb-3">Command Center</p>
            <h1 className="text-3xl font-black tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">Sign in to manage workers, tasks, live runs, and memory.</p>

            <button type="button" onClick={handleGoogle} className="button-secondary mt-7 w-full">
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="label-premium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="input-premium"
                />
              </div>
              <div className="space-y-2">
                <label className="label-premium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="input-premium"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="button-primary w-full">
                {loading ? "Signing in..." : <>Sign In <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-300">
              No account?{" "}
              <Link href="/register" className="font-bold text-cyan-100 hover:text-white">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthShowcase({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <section className="relative hidden min-h-screen border-r border-white/10 px-10 py-10 lg:flex lg:flex-col lg:justify-between">
      <Link href="/" className="flex items-center gap-3">
        <div className="brand-mark h-10 w-10"><Bot className="h-5 w-5" /></div>
        <div>
          <p className="text-sm font-black text-white">RZG AI</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Workforce Command</p>
        </div>
      </Link>

      <div className="max-w-xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-4 text-5xl font-black leading-tight tracking-tight text-white">{title}</h2>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          Inspect live execution, assign missions, and preserve operational memory across every AI worker.
        </p>
        <div className="mt-8 grid gap-3">
          {[
            [Radio, "Live execution stream"],
            [Brain, "Persistent memory vault"],
            [Zap, "Worker task orchestration"],
          ].map(([Icon, text]) => (
            <div key={text as string} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-bold text-slate-100">
              <Icon className="h-5 w-5 text-cyan-200" />
              {text as string}
            </div>
          ))}
        </div>
      </div>

      <div className="console-shell">
        <div className="console-header">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-200" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-200">Preview</span>
          </div>
          <span className="badge badge-blue">Online</span>
        </div>
        <div className="console-body p-4">
          {["Research Lead connected", "Memory layer mounted", "Task queue ready", "Awaiting operator"].map((line) => (
            <div key={line} className="exec-line">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
