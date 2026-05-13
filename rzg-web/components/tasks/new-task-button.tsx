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

  return (
    <>
      <button onClick={() => setOpen(true)} className="button-primary">
        <Plus className="h-4 w-4" />
        New Task
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="surface-panel w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="brand-mark h-9 w-9"><Zap className="h-4 w-4" /></div>
                <div>
                  <p className="eyebrow">Mission Control</p>
                  <h2 className="font-bold text-white">New Task</h2>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="button-secondary px-2.5 py-2" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 p-5">
              <div className="space-y-2">
                <label className="label-premium">AI Worker</label>
                <select value={form.agentId} onChange={(e) => set("agentId", e.target.value)} className="input-premium">
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="label-premium">Task Name</label>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Q2 competitor analysis" className="input-premium" />
              </div>

              <div className="space-y-2">
                <label className="label-premium">Prompt</label>
                <textarea value={form.prompt} onChange={(e) => set("prompt", e.target.value)} required rows={5} placeholder="Research the top competitors and compare pricing, features, and positioning..." className="input-premium resize-none" />
              </div>

              {error && <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading} className="button-primary flex-1">
                  {loading ? "Creating..." : "Create Task"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="button-secondary">
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
