"use client";

import { useState } from "react";
import { Brain, Globe2, Plus, Trash2, UserRound, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

type Agent = { id: string; name: string };

type Memory = {
  id: string;
  key: string;
  content: string;
  agentId: string | null;
  agentName: string | null;
  createdAt: Date | string | null;
};

interface Props {
  initialMemories: Memory[];
  agents: Agent[];
}

export function MemoryManager({ initialMemories, agents }: Props) {
  const [memoryList, setMemoryList] = useState<Memory[]>(initialMemories);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: "", content: "", agentId: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: form.key,
          content: form.content,
          agentId: form.agentId || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error?.formErrors?.[0] ?? JSON.stringify(d.error) ?? "Failed");
      }
      const { memory } = await res.json();
      const agent = agents.find((a) => a.id === memory.agentId);
      setMemoryList((prev) => [...prev, { ...memory, agentName: agent?.name ?? null }]);
      setForm({ key: "", content: "", agentId: "" });
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMemoryList((prev) => prev.filter((m) => m.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      // Non-destructive UI: keep the existing memory visible if deletion fails.
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-300">
          {memoryList.length} memor{memoryList.length !== 1 ? "ies" : "y"} stored
        </p>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="button-primary">
          <Plus className="h-4 w-4" />
          Add Memory
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="surface-panel w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="brand-mark h-9 w-9"><Brain className="h-4 w-4" /></div>
                <div>
                  <p className="eyebrow">Memory Vault</p>
                  <h2 className="font-bold text-white">New Memory Entry</h2>
                </div>
              </div>
              <button onClick={() => { setShowForm(false); setError(""); }} className="button-secondary px-2.5 py-2" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 p-5">
              <Field label="Key">
                <input type="text" required value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} placeholder="brand_voice / project_context / customer_profile" className="input-premium" />
              </Field>
              <Field label="Content">
                <textarea required value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={4} placeholder="The stored fact, instruction, or reusable context..." className="input-premium resize-none" />
              </Field>
              {agents.length > 0 && (
                <Field label="Scope">
                  <select value={form.agentId} onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value }))} className="input-premium">
                    <option value="">Global — all workers</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </Field>
              )}

              {error && <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="button-primary flex-1">
                  {saving ? "Saving..." : "Save Memory"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="button-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {memoryList.length === 0 && !showForm ? (
        <EmptyState
          icon={<Brain className="h-7 w-7" />}
          title="No memories yet"
          description="Add memories to give your AI workers persistent knowledge across future tasks."
        />
      ) : (
        <div className="surface-panel overflow-hidden">
          <div className="hidden border-b border-white/10 bg-white/[0.035] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 lg:grid lg:grid-cols-[220px_1fr_190px_44px]">
            <span>Key</span>
            <span>Content</span>
            <span>Scope</span>
            <span />
          </div>
          <div className="divide-y divide-white/10">
            {memoryList.map((m) => (
              <div key={m.id}>
                <div onClick={() => setExpandedId(expandedId === m.id ? null : m.id)} className="grid w-full cursor-pointer gap-4 px-5 py-4 text-left transition hover:bg-cyan-300/[0.035] lg:grid-cols-[220px_1fr_190px_44px] lg:items-center">
                  <code className="truncate rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 font-mono text-xs font-bold text-cyan-100">{m.key}</code>
                  <span className="line-clamp-2 text-sm leading-6 text-slate-300">{m.content}</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    {m.agentName ? <UserRound className="h-4 w-4 text-cyan-200" /> : <Globe2 className="h-4 w-4 text-cyan-200" />}
                    {m.agentName ?? "Global"}
                  </span>
                  <span className="flex justify-start lg:justify-end">
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} disabled={deleting === m.id} className="button-secondary px-2.5 py-2" title="Delete memory">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                </div>

                {expandedId === m.id && (
                  <div className="border-t border-white/10 bg-white/[0.025] px-5 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-white">{m.content}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-400">
                      {m.agentName ? `Assigned to ${m.agentName}` : "Global memory available to all workers"}
                      {m.createdAt && ` · ${new Date(m.createdAt).toLocaleString()}`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="label-premium">{label}</label>
      {children}
    </div>
  );
}
