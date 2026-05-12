"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { AGENT_TEMPLATES, type AgentTemplate } from "@/lib/agent-templates";

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
      setSelectedTemplateId(null); // mark as customised
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
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/agents"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-semibold">New AI Worker</h1>
      </div>

      {/* Template picker */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Start from a template — or fill in the form below
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {AGENT_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              title={t.description}
              className={`flex flex-col items-start gap-1 px-3 py-2.5 border rounded-lg text-left transition-all ${
                selectedTemplateId === t.id
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-border hover:border-blue-500/50 hover:bg-blue-500/5"
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-xs font-medium leading-tight">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identity */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Identity</span>
          </div>

          <Field label="Worker Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Research Agent"
              className={INPUT_CLS}
            />
          </Field>

          <Field label="Role" required hint="What kind of specialist is this worker?">
            <input
              type="text"
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              required
              placeholder="Senior Research Analyst"
              className={INPUT_CLS}
            />
          </Field>

          <Field label="Goal" required hint="The primary objective this agent is designed to achieve">
            <textarea
              value={form.goal}
              onChange={(e) => set("goal", e.target.value)}
              required
              rows={3}
              placeholder="Conduct thorough research and synthesize findings into clear reports…"
              className={`${INPUT_CLS} resize-none`}
            />
          </Field>

          {/* Collapsible instructions */}
          <div>
            <button
              type="button"
              onClick={() => setShowInstructions((v) => !v)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showInstructions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showInstructions ? "Hide" : "Show"} system instructions
              {form.instructions && !showInstructions && (
                <span className="text-blue-400 ml-1">✓ set</span>
              )}
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

        {/* Model & settings */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <span className="text-sm font-medium">Model & Settings</span>

          <Field label="Model">
            <select
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              className={INPUT_CLS}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Max Iterations" hint="Tool-calling steps allowed per run (1–90)">
            <input
              type="number"
              value={form.maxIterations}
              onChange={(e) => set("maxIterations", parseInt(e.target.value, 10))}
              min={1}
              max={90}
              className={`${INPUT_CLS} w-28`}
            />
          </Field>

          <Toggle
            enabled={form.memoryEnabled}
            onToggle={() => set("memoryEnabled", !form.memoryEnabled)}
            label="Persistent memory"
            hint="Agent retains knowledge across tasks (requires Hermes memory system)"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
          >
            {loading ? "Creating…" : "Create AI Worker"}
          </button>
          <Link
            href="/dashboard/agents"
            className="px-5 py-2.5 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

const INPUT_CLS =
  "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-blue-500 transition-colors font-sans";

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}{" "}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Toggle({
  enabled,
  onToggle,
  label,
  hint,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-3 w-full text-left"
    >
      <div
        className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
          enabled ? "bg-blue-600" : "bg-secondary"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
      <div>
        <span className="text-sm font-medium">{label}</span>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </button>
  );
}
