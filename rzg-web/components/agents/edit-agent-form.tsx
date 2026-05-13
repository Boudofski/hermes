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

  const SURFACE = { background: "#0b0e18", border: "1px solid #1e2640" };
  const INPUT_CLS = "w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none transition-all font-sans";
  const INPUT_STYLE = { background: "#0d1120", border: "1px solid #1e2640", caretColor: "#3b82f6" };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Identity */}
      <div className="rounded-xl p-5 space-y-4" style={SURFACE}>
        <span className="text-sm font-semibold text-white">Identity</span>

        <Field label="Worker Name" required>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Research Agent"
            className={INPUT_CLS} style={INPUT_STYLE}
            onFocus={e => (e.target.style.borderColor = "#2563eb")}
            onBlur={e => (e.target.style.borderColor = "#1e2640")} />
        </Field>

        <Field label="Role" required hint="What kind of specialist is this worker?">
          <input type="text" value={form.role} onChange={(e) => set("role", e.target.value)} required placeholder="Senior Research Analyst"
            className={INPUT_CLS} style={INPUT_STYLE}
            onFocus={e => (e.target.style.borderColor = "#2563eb")}
            onBlur={e => (e.target.style.borderColor = "#1e2640")} />
        </Field>

        <Field label="Goal" required hint="The primary objective this agent is designed to achieve">
          <textarea value={form.goal} onChange={(e) => set("goal", e.target.value)} required rows={3} placeholder="Conduct thorough research…"
            className={`${INPUT_CLS} resize-none`} style={INPUT_STYLE}
            onFocus={e => (e.target.style.borderColor = "#2563eb")}
            onBlur={e => (e.target.style.borderColor = "#1e2640")} />
        </Field>

        <div>
          <button
            type="button"
            onClick={() => setShowInstructions((v) => !v)}
            className="flex items-center gap-2 text-xs transition-colors"
            style={{ color: "#4a5568" }}
          >
            {showInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showInstructions ? "Hide" : "Show"} system instructions
            {form.instructions && !showInstructions && <span style={{ color: "#3b82f6" }} className="ml-1">✓ set</span>}
          </button>
          {showInstructions && (
            <textarea
              value={form.instructions}
              onChange={(e) => set("instructions", e.target.value)}
              rows={10}
              placeholder="Detailed instructions, protocols, output formats, constraints…"
              className={`mt-2 ${INPUT_CLS} resize-y font-mono text-xs`}
              style={INPUT_STYLE}
            />
          )}
        </div>
      </div>

      {/* Model & Settings */}
      <div className="rounded-xl p-5 space-y-4" style={SURFACE}>
        <span className="text-sm font-semibold text-white">Model & Settings</span>

        <Field label="Model">
          <select value={form.model} onChange={(e) => set("model", e.target.value)} className={INPUT_CLS} style={INPUT_STYLE}>
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Max Iterations" hint="Tool-calling steps allowed per run (1–90)">
          <input type="number" value={form.maxIterations} onChange={(e) => set("maxIterations", parseInt(e.target.value, 10))}
            min={1} max={90} className={`${INPUT_CLS} w-28`} style={INPUT_STYLE} />
        </Field>

        <Toggle
          enabled={form.memoryEnabled}
          onToggle={() => set("memoryEnabled", !form.memoryEnabled)}
          label="Persistent memory"
          hint="Agent retains knowledge across tasks"
        />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "#1d4ed8" }}
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
        <Link
          href="/dashboard/agents"
          className="px-5 py-2.5 rounded-lg text-sm transition-all"
          style={{ border: "1px solid #1e2640", color: "#6b7a95" }}
        >
          Cancel
        </Link>

        <div className="ml-auto">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={{ border: "1px solid rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.7)" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Worker
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "#4a5568" }}>Sure? This deletes all tasks too.</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "#dc2626" }}
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{ border: "1px solid #1e2640", color: "#6b7a95" }}
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
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: "#6b7a95" }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs" style={{ color: "#3a4455" }}>{hint}</p>}
    </div>
  );
}

function Toggle({ enabled, onToggle, label, hint }: { enabled: boolean; onToggle: () => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-3 w-full text-left">
      <div className="w-10 h-5 rounded-full transition-colors relative shrink-0" style={{ background: enabled ? "#1d4ed8" : "#1e2640" }}>
        <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
          style={{ transform: enabled ? "translateX(20px)" : "translateX(2px)" }} />
      </div>
      <div>
        <span className="text-sm font-medium text-white">{label}</span>
        {hint && <p className="text-xs mt-0.5" style={{ color: "#4a5568" }}>{hint}</p>}
      </div>
    </button>
  );
}
