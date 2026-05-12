"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

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

const INPUT_CLS =
  "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-blue-500 transition-colors font-sans";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <span className="text-sm font-medium">Identity</span>

        <Field label="Worker Name" required>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Research Agent" className={INPUT_CLS} />
        </Field>

        <Field label="Role" required hint="What kind of specialist is this worker?">
          <input type="text" value={form.role} onChange={(e) => set("role", e.target.value)} required placeholder="Senior Research Analyst" className={INPUT_CLS} />
        </Field>

        <Field label="Goal" required hint="The primary objective this agent is designed to achieve">
          <textarea value={form.goal} onChange={(e) => set("goal", e.target.value)} required rows={3} placeholder="Conduct thorough research…" className={`${INPUT_CLS} resize-none`} />
        </Field>

        <div>
          <button
            type="button"
            onClick={() => setShowInstructions((v) => !v)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showInstructions ? "Hide" : "Show"} system instructions
            {form.instructions && !showInstructions && <span className="text-blue-400 ml-1">✓ set</span>}
          </button>
          {showInstructions && (
            <textarea
              value={form.instructions}
              onChange={(e) => set("instructions", e.target.value)}
              rows={10}
              placeholder="Detailed instructions, protocols, output formats, constraints…"
              className={`mt-2 ${INPUT_CLS} resize-y font-mono text-xs`}
            />
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <span className="text-sm font-medium">Model & Settings</span>

        <Field label="Model">
          <select value={form.model} onChange={(e) => set("model", e.target.value)} className={INPUT_CLS}>
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Max Iterations" hint="Tool-calling steps allowed per run (1–90)">
          <input type="number" value={form.maxIterations} onChange={(e) => set("maxIterations", parseInt(e.target.value, 10))} min={1} max={90} className={`${INPUT_CLS} w-28`} />
        </Field>

        <Toggle
          enabled={form.memoryEnabled}
          onToggle={() => set("memoryEnabled", !form.memoryEnabled)}
          label="Persistent memory"
          hint="Agent retains knowledge across tasks"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
        <Link
          href="/dashboard/agents"
          className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
        >
          Cancel
        </Link>

        <div className="ml-auto">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2.5 border border-destructive/40 text-destructive/70 hover:border-destructive hover:text-destructive rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Worker
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sure? This deletes all tasks too.</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 bg-destructive hover:bg-destructive/80 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-secondary transition-colors"
              >
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
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Toggle({ enabled, onToggle, label, hint }: { enabled: boolean; onToggle: () => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-3 w-full text-left">
      <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${enabled ? "bg-blue-600" : "bg-secondary"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
      <div>
        <span className="text-sm font-medium">{label}</span>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </button>
  );
}
