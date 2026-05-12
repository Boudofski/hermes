"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

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
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Task
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">New Task</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">AI Worker</label>
                <select
                  value={form.agentId}
                  onChange={(e) => set("agentId", e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Task Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  placeholder="Q2 competitor analysis"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Prompt</label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => set("prompt", e.target.value)}
                  required
                  rows={4}
                  placeholder="Research the top 5 competitors in the B2B SaaS project management space and compare their pricing, features, and positioning…"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-blue-500 transition-colors resize-none font-sans"
                />
              </div>

              {error && <p className="text-destructive text-xs">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  {loading ? "Creating…" : "Create Task"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
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
