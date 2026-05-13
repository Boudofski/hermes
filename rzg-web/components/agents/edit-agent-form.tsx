"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

const MODELS = [
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini — fast, cheap" },
  { value: "openai/gpt-4o", label: "GPT-4o — powerful" },
  { value: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "meta-llama/llama-4-scout", label: "Llama 4 Scout (fast, free tier)" },
  { value: "mistralai/mistral-small-3.2-24b-instruct", label: "Mistral Small 3.2" },
];

interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  instructions: string | null;
  model: string;
  memoryEnabled: boolean;
  maxIterations: number;
}

export function EditAgentForm({ agent }: { agent: Agent }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showInstructions, setShowInstructions] = useState(!!agent.instructions);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    name: agent.name,
    role: agent.role,
    goal: agent.goal,
    instructions: agent.instructions ?? "",
    model: agent.model,
    memoryEnabled: agent.memoryEnabled,
    maxIterations: agent.maxIterations,
  });

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.formErrors?.[0] ?? JSON.stringify(data.error) ?? "Failed to update");
      }
      router.push("/dashboard/agents");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/dashboard/agents");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="min-w-0 space-y-5">
      <section className="surface-card p-5 sm:p-6">
        <h2 className="text-lg font-bold text-white">Identity</h2>
        <div className="mt-5 grid min-w-0 gap-4">
          <Field label="Worker Name" required>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Research Agent" className="input-premium" />
          </Field>
          <Field label="Role" required hint="What kind of specialist is this worker?">
            <input type="text" value={form.role} onChange={(e) => set("role", e.target.value)} required placeholder="Senior Research Analyst" className="input-premium" />
          </Field>
          <Field label="Goal" required hint="The primary objective this worker is designed to achieve.">
            <textarea value={form.goal} onChange={(e) => set("goal", e.target.value)} required rows={4} placeholder="Conduct thorough research..." className="input-premium resize-none" />
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
        <Toggle enabled={form.memoryEnabled} onToggle={() => set("memoryEnabled", !form.memoryEnabled)} label="Persistent memory" hint="Agent retains knowledge across tasks." />
      </section>

      {error && <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">{error}</div>}

      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <button type="submit" disabled={loading} className="button-primary">
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <Link href="/dashboard/agents" className="button-secondary">Cancel</Link>

        <div className="min-w-0 sm:ml-auto">
          {!showDeleteConfirm ? (
            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="button-danger">
              <Trash2 className="h-4 w-4" />
              Delete Worker
            </button>
          ) : (
            <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 p-2">
              <span className="break-words px-2 text-xs font-semibold text-red-100">Deletes this worker and its tasks.</span>
              <button type="button" onClick={handleDelete} disabled={deleting} className="button-danger px-3 py-2 text-xs">
                {deleting ? "Deleting..." : "Confirm"}
              </button>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="button-secondary px-3 py-2 text-xs">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
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
