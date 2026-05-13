"use client";

import { useState } from "react";
import { Plus, Trash2, Brain, ChevronDown, ChevronUp } from "lucide-react";

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
    } catch {
      // silently fail
    } finally {
      setDeleting(null);
    }
  }

  const INPUT_CLS =
    "w-full px-3.5 py-2.5 bg-white/4 border border-white/8 hover:border-white/15 focus:border-blue-500 rounded-xl text-sm outline-none transition-colors placeholder:text-muted-foreground/50";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {memoryList.length} memor{memoryList.length !== 1 ? "ies" : "y"}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Memory
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="glass border-blue-500/30 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">New Memory Entry</p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Key</label>
            <input
              type="text"
              required
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              placeholder="user_preference / project_context / tone_of_voice…"
              className={INPUT_CLS}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Content</label>
            <textarea
              required
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={3}
              placeholder="The stored fact, instruction, or context…"
              className={`${INPUT_CLS} resize-none`}
            />
          </div>

          {agents.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Assign to worker <span className="text-muted-foreground/60 font-normal">(optional)</span>
              </label>
              <select
                value={form.agentId}
                onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value }))}
                className={INPUT_CLS}
              >
                <option value="">— Global (all workers) —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all"
            >
              {saving ? "Saving…" : "Save Memory"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="px-5 py-2 border border-white/10 hover:border-white/20 rounded-xl text-xs hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Memory list */}
      {memoryList.length === 0 && !showForm ? (
        <div className="glass rounded-2xl p-14 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto">
            <Brain className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <p className="font-medium text-sm">No memories yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              Add memories manually, or enable persistent memory on an AI worker and they will record knowledge automatically as they run tasks.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {memoryList.map((m) => (
            <div key={m.id} className="glass rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <code className="text-xs font-mono text-blue-400 shrink-0 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                    {m.key}
                  </code>
                  <span className="text-xs text-muted-foreground truncate">{m.content}</span>
                  {expandedId === m.id
                    ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                </button>
                {m.agentName && (
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{m.agentName}</span>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  disabled={deleting === m.id}
                  className="p-1.5 text-muted-foreground hover:text-red-400 disabled:opacity-40 transition-colors shrink-0"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {expandedId === m.id && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {m.agentName ? `Assigned to: ${m.agentName}` : "Global — available to all workers"}
                    {m.createdAt && ` · ${new Date(m.createdAt).toLocaleString()}`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
