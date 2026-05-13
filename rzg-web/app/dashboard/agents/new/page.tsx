"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Brain,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Megaphone,
  Microscope,
  PenLine,
  Settings2,
  Smartphone,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { AGENT_TEMPLATES, type AgentTemplate } from "@/lib/agent-templates";

const ICON_MAP: Record<string, LucideIcon> = {
  Microscope,
  PenLine,
  TrendingUp,
  Target,
  Megaphone,
  Smartphone,
  ClipboardList,
  Settings2,
};

const MODELS = [
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini — fast, cheap" },
  { value: "openai/gpt-4o", label: "GPT-4o — powerful" },
  { value: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "meta-llama/llama-4-scout", label: "Llama 4 Scout (fast, free tier)" },
  { value: "mistralai/mistral-small-3.2-24b-instruct", label: "Mistral Small 3.2" },
];

interface FormState {
  name: string;
  role: string;
  goal: string;
  instructions: string;
  model: string;
  memoryEnabled: boolean;
  maxIterations: number;
}

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    role: "",
    goal: "",
    instructions: "",
    model: "openai/gpt-4o-mini",
    memoryEnabled: false,
    maxIterations: 20,
  });

  function applyTemplate(t: AgentTemplate) {
    setSelectedTemplateId(t.id);
    setForm({
      name: t.name,
      role: t.role,
      goal: t.goal,
      instructions: t.instructions,
      model: t.model,
      memoryEnabled: t.memoryEnabled,
      maxIterations: t.maxIterations,
    });
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key !== "name" && key !== "model" && key !== "memoryEnabled" && key !== "maxIterations") {
      setSelectedTemplateId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? JSON.stringify(data.error) ?? "Failed to create agent");
      }
      router.push("/dashboard/agents");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <div className="border-b border-white/10 px-5 py-6 sm:px-8">
        <Link href="/dashboard/agents" className="button-secondary mb-5 px-3 py-2">
          <ArrowLeft className="h-4 w-4" />
          Directory
        </Link>
        <p className="eyebrow">Hire AI Employee</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">New AI Worker</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Define the worker role, operating objective, model, and memory behavior used for future missions.
        </p>
      </div>

      <div className="grid gap-6 p-5 sm:p-8 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="surface-card p-5">
            <div className="brand-mark mb-4 h-12 w-12"><Bot className="h-6 w-6" /></div>
            <h2 className="text-xl font-bold text-white">Worker setup protocol</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Strong workers need a clear role, measurable goal, and enough instructions to constrain output.
            </p>
          </div>
          <div className="metal-panel p-5">
            <p className="eyebrow">Templates</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Templates are hiring briefs. Selecting one fills the form, but every field remains editable.
            </p>
          </div>
        </aside>

        <main className="space-y-6">
          <section>
            <p className="label-premium mb-3">Start from a template</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {AGENT_TEMPLATES.map((t) => {
                const Icon = ICON_MAP[t.icon] ?? Bot;
                const active = selectedTemplateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className={`rounded-2xl border p-4 text-left transition ${active ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 bg-white/[0.04] hover:border-cyan-300/30 hover:bg-cyan-300/10"}`}
                  >
                    <Icon className="mb-3 h-5 w-5 text-cyan-100" />
                    <p className="font-bold text-white">{t.name.replace(" Agent", "")}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{t.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="surface-card p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="brand-mark h-10 w-10"><Bot className="h-5 w-5" /></div>
                <h2 className="text-lg font-bold text-white">Identity</h2>
              </div>
              <div className="grid gap-4">
                <Field label="Worker Name" required>
                  <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Research Agent" className="input-premium" />
                </Field>
                <Field label="Role" required hint="What specialist job should this worker perform?">
                  <input type="text" value={form.role} onChange={(e) => set("role", e.target.value)} required placeholder="Senior Research Analyst" className="input-premium" />
                </Field>
                <Field label="Goal" required hint="The primary objective this worker should optimize for.">
                  <textarea value={form.goal} onChange={(e) => set("goal", e.target.value)} required rows={4} placeholder="Conduct thorough research and synthesize findings into clear reports..." className="input-premium resize-none" />
                </Field>
                <div>
                  <button type="button" onClick={() => setShowInstructions((v) => !v)} className="button-secondary px-3 py-2">
                    {showInstructions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {showInstructions ? "Hide" : "Show"} system instructions
                  </button>
                  {showInstructions && (
                    <textarea value={form.instructions} onChange={(e) => set("instructions", e.target.value)} rows={10} placeholder="Detailed instructions, protocols, output formats, constraints..." className="input-premium mt-3 resize-y font-mono text-xs" />
                  )}
                </div>
              </div>
            </section>

            <section className="surface-card p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="brand-mark h-10 w-10"><Brain className="h-5 w-5" /></div>
                <h2 className="text-lg font-bold text-white">Model & Runtime</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Model">
                  <select value={form.model} onChange={(e) => set("model", e.target.value)} className="input-premium">
                    {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </Field>
                <Field label="Max Iterations" hint="Tool-calling steps allowed per run, 1-90.">
                  <input type="number" value={form.maxIterations} onChange={(e) => set("maxIterations", parseInt(e.target.value, 10))} min={1} max={90} className="input-premium" />
                </Field>
              </div>
              <Toggle enabled={form.memoryEnabled} onToggle={() => set("memoryEnabled", !form.memoryEnabled)} label="Persistent memory" hint="Allow this worker to retain knowledge across tasks." />
            </section>

            {error && <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">{error}</div>}

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={loading} className="button-primary">
                {loading ? "Creating..." : "Create AI Worker"}
              </button>
              <Link href="/dashboard/agents" className="button-secondary">Cancel</Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function Field({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div className="space-y-2">
      <label className="label-premium">{label}{required && <span className="text-red-200"> *</span>}</label>
      {children}
      {hint && <p className="helper-text">{hint}</p>}
    </div>
  );
}

function Toggle({ enabled, onToggle, label, hint }: { enabled: boolean; onToggle: () => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={onToggle} className="mt-5 flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:border-cyan-300/30">
      <span className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-cyan-300" : "bg-slate-700"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-6" : "translate-x-1"}`} />
      </span>
      <span>
        <span className="block font-bold text-white">{label}</span>
        {hint && <span className="helper-text mt-1 block">{hint}</span>}
      </span>
    </button>
  );
}
