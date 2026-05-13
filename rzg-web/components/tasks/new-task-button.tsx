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

  const INPUT_CLS =
    "w-full px-3.5 py-2.5 bg-white/4 border border-white/8 hover:border-white/15 focus:border-blue-500 rounded-xl text-sm outline-none transition-colors placeholder:text-muted-foreground/50 font-sans";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all"
      >
        <Plus className="w-4 h-4" />
        New Task
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl w-full max-w-md shadow-2xl border-white/12">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <h2 className="font-semibold text-sm">New Task</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">AI Worker</label>
                <select
                  value={form.agentId}
                  onChange={(e) => set("agentId", e.target.value)}
                  className={INPUT_CLS}
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Task Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  placeholder="Q2 competitor analysis"
                  className={INPUT_CLS}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Prompt</label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => set("prompt", e.target.value)}
                  required
                  rows={4}
                  placeholder="Research the top 5 competitors in the B2B SaaS project management space and compare their pricing, features, and positioning…"
                  className={`${INPUT_CLS} resize-none`}
                />
              </div>

              {error && (
                <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl transition-all text-sm"
                >
                  {loading ? "Creating…" : "Create Task"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 border border-white/10 hover:border-white/20 rounded-xl text-sm hover:bg-white/5 transition-all"
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
