"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bot, ArrowRight, CheckCircle, Sparkles } from "lucide-react";

const SELLING_POINTS = [
  "Deploy in under 60 seconds",
  "8 specialist AI worker templates",
  "Live execution streaming",
  "Persistent memory across tasks",
];

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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)", color: "#60a5fa" }}>
              <Sparkles className="w-3 h-3" />
              Free to start
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Your AI workforce starts here.</h2>
            <p className="text-base leading-relaxed" style={{ color: "#6b7a95" }}>
              Create autonomous AI specialists and deploy them to handle research, content, and business workflows.
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

          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-sm mb-8" style={{ color: "#6b7a95" }}>Start deploying AI workers for free</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#6b7a95" }}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Jane Smith"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                style={{ background: "#0d1120", border: "1px solid #1e2640", caretColor: "#3b82f6" }}
                onFocus={e => (e.target.style.borderColor = "#2563eb")}
                onBlur={e => (e.target.style.borderColor = "#1e2640")}
              />
            </div>
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
                style={{ background: "#0d1120", border: "1px solid #1e2640", caretColor: "#3b82f6" }}
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
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                style={{ background: "#0d1120", border: "1px solid #1e2640", caretColor: "#3b82f6" }}
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
              {loading ? "Creating account…" : <><span>Create Free Account</span><ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </form>

          <p className="text-xs mt-4 text-center" style={{ color: "#3a4455" }}>
            By creating an account you agree to our Terms of Service.
          </p>

          <p className="text-sm mt-5 text-center" style={{ color: "#6b7a95" }}>
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
