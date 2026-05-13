"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Bot, Brain, CheckCircle2, Radio, Sparkles, Terminal, Users, Zap } from "lucide-react";
import { OrbitalBackground } from "@/components/ui/orbital-background";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (authError) throw authError;
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="rzg-root relative grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <OrbitalBackground dense />
      <section className="relative hidden min-h-screen border-r border-white/10 px-10 py-10 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="brand-mark h-10 w-10"><Bot className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-black text-white">RZG AI</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Workforce Command</p>
          </div>
        </Link>

        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Free to start
          </div>
          <h2 className="text-5xl font-black leading-tight tracking-tight text-white">Create your first AI employee roster.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Start with specialist workers for research, content, SEO, sales, and operations. Then assign real tasks and watch them execute.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              [Users, "Worker directory"],
              [Zap, "Mission control"],
              [Radio, "Live execution"],
              [Brain, "Memory vault"],
            ].map(([Icon, text]) => (
              <div key={text as string} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <Icon className="mb-3 h-5 w-5 text-cyan-200" />
                <p className="text-sm font-bold text-white">{text as string}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="console-shell">
          <div className="console-header">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-200" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-200">Provisioning</span>
            </div>
            <span className="badge badge-blue">Ready</span>
          </div>
          <div className="console-body p-4">
            {["Workspace created", "Templates available", "Adapter online", "Awaiting first worker"].map((line) => (
              <div key={line} className="exec-line">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="brand-mark h-9 w-9"><Bot className="h-5 w-5" /></div>
            <span className="text-sm font-black text-white">RZG AI</span>
          </Link>

          <div className="surface-panel p-6 sm:p-8">
            <p className="eyebrow mb-3">New Workspace</p>
            <h1 className="text-3xl font-black tracking-tight text-white">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">Start deploying AI workers for real business workflows.</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div className="space-y-2">
                <label className="label-premium">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Jane Smith"
                  className="input-premium"
                />
              </div>
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
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  className="input-premium"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="button-primary w-full">
                {loading ? "Creating account..." : <>Create Free Account <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <p className="mt-4 text-center text-xs leading-5 text-slate-400">
              By creating an account you agree to the platform terms.
            </p>
            <p className="mt-5 text-center text-sm text-slate-300">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-cyan-100 hover:text-white">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
