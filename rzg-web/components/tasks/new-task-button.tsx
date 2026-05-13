"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Zap } from "lucide-react";

type Agent = { id: string; name: string; role: string };

export function NewTaskButton({ agents, defaultAgentId }: { agents: Agent[]; defaultAgentId?: string }) {
  const validDefault = defaultAgentId && agents.some((a) => a.id === defaultAgentId);
  const [open, setOpen] = useState(!!validDefault);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const initialAgentId = validDefault ? defaultAgentId : agents[0]?.id ?? "";

  const [form, setForm] = useState({ agentId: initialAgentId, name: "", prompt: "" });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed to create task");
      }
      const task = await res.json();
      setOpen(false);
      router.push(`/dashboard/tasks/${task.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (agents.length === 0) return null;

  const INPUT_CLS = "w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none transition-all font-sans";
  const INPUT_STYLE = { background: "#0b0e18", border: "1px solid #1e2640", caretColor: "#3b82f6" };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
        style={{ background: "#1d4ed8" }}
      >
        <Plus className="w-4 h-4" />
        New Task
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e2640" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.25)" }}>
                  <Zap className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
                </div>
                <h2 className="font-semibold text-sm text-white">New Task</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{ color: "#4a5568" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: "#6b7a95" }}>AI Worker</label>
                <select
                  value={form.agentId}
                  onChange={(e) => set("agentId", e.target.value)}
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: "#6b7a95" }}>Task Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  placeholder="Q2 competitor analysis"
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = "#2563eb")}
                  onBlur={e => (e.target.style.borderColor = "#1e2640")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: "#6b7a95" }}>Prompt</label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => set("prompt", e.target.value)}
                  required
                  rows={4}
                  placeholder="Research the top 5 competitors in the B2B SaaS project management space and compare their pricing, features, and positioning…"
                  className={`${INPUT_CLS} resize-none`}
                  style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = "#2563eb")}
                  onBlur={e => (e.target.style.borderColor = "#1e2640")}
                />
              </div>

              {error && (
                <div className="px-3.5 py-2.5 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: "#1d4ed8" }}
                >
                  {loading ? "Creating…" : "Create Task"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm transition-all"
                  style={{ border: "1px solid #1e2640", color: "#6b7a95" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
