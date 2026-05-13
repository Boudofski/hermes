"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bot, ArrowRight, CheckCircle } from "lucide-react";

const SELLING_POINTS = [
  "8 specialist AI worker templates",
  "Live execution streaming",
  "Persistent memory across tasks",
  "No setup, runs in the cloud",
];

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
    <div className="min-h-screen flex" style={{ background: "#07090f" }}>
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #0a0f1e 0%, #07090f 100%)", borderRight: "1px solid #1e2640" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 20% 40%, rgba(37,99,235,0.12) 0%, transparent 70%)" }}
        />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Bot className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">RZG AI</span>
        </Link>

        {/* Copy */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-3">Your AI workforce awaits.</h2>
            <p className="text-base leading-relaxed" style={{ color: "#6b7a95" }}>
              Deploy autonomous specialists for research, content, and business automation — in minutes.
            </p>
          </div>
          <div className="space-y-3">
            {SELLING_POINTS.map((p) => (
              <div key={p} className="flex items-center gap-2.5 text-sm" style={{ color: "#8b95a7" }}>
                <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                {p}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs" style={{ color: "#2d3a52" }}>© 2026 RZG AI</p>
      </div>

      {/* ── Right panel / form ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">RZG AI</span>
          </Link>

          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: "#6b7a95" }}>Sign in to your workspace</p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all mb-4"
            style={{ background: "#0d1120", border: "1px solid #1e2640" }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "#1e2640" }} />
            <span className="text-xs" style={{ color: "#3a4455" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#1e2640" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#6b7a95" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                style={{
                  background: "#0d1120",
                  border: "1px solid #1e2640",
                  caretColor: "#3b82f6",
                }}
                onFocus={e => (e.target.style.borderColor = "#2563eb")}
                onBlur={e => (e.target.style.borderColor = "#1e2640")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#6b7a95" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                style={{
                  background: "#0d1120",
                  border: "1px solid #1e2640",
                  caretColor: "#3b82f6",
                }}
                onFocus={e => (e.target.style.borderColor = "#2563eb")}
                onBlur={e => (e.target.style.borderColor = "#1e2640")}
              />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all mt-1 disabled:opacity-50"
              style={{ background: "#1d4ed8" }}
            >
              {loading ? "Signing in…" : <><span>Sign In</span><ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </form>

          <p className="text-sm mt-6 text-center" style={{ color: "#6b7a95" }}>
            No account?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
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
