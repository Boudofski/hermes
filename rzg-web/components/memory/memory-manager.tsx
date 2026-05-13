"use client";

import { useState } from "react";
import { Plus, Trash2, Brain, X } from "lucide-react";

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
      // silently fail
    } finally {
      setDeleting(null);
    }
  }

  const INPUT_STYLE = { background: "#0d1120", border: "1px solid #1e2640", caretColor: "#3b82f6" };
  const INPUT_CLS = "w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none transition-all";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#4a5568" }}>
          {memoryList.length} memor{memoryList.length !== 1 ? "ies" : "y"}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition-all"
          style={{ background: "#1d4ed8" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Memory
        </button>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e2640" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}>
                  <Brain className="w-3.5 h-3.5" style={{ color: "#06b6d4" }} />
                </div>
                <h2 className="font-semibold text-sm text-white">New Memory Entry</h2>
              </div>
              <button
                onClick={() => { setShowForm(false); setError(""); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ color: "#4a5568" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: "#6b7a95" }}>Key</label>
                <input
                  type="text"
                  required
                  value={form.key}
                  onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                  placeholder="user_preference / project_context / tone_of_voice…"
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = "#2563eb")}
                  onBlur={e => (e.target.style.borderColor = "#1e2640")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: "#6b7a95" }}>Content</label>
                <textarea
                  required
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={3}
                  placeholder="The stored fact, instruction, or context…"
                  className={`${INPUT_CLS} resize-none`}
                  style={INPUT_STYLE}
                  onFocus={e => (e.target.style.borderColor = "#2563eb")}
                  onBlur={e => (e.target.style.borderColor = "#1e2640")}
                />
              </div>

              {agents.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium" style={{ color: "#6b7a95" }}>
                    Assign to worker <span style={{ color: "#3a4455" }}>(optional)</span>
                  </label>
                  <select
                    value={form.agentId}
                    onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value }))}
                    className={INPUT_CLS}
                    style={INPUT_STYLE}
                  >
                    <option value="">— Global (all workers) —</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="px-3.5 py-2.5 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: "#1d4ed8" }}
                >
                  {saving ? "Saving…" : "Save Memory"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(""); }}
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

      {/* Memory table */}
      {memoryList.length === 0 && !showForm ? (
        <div className="rounded-xl p-14 text-center" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <Brain className="w-6 h-6" style={{ color: "#06b6d4" }} />
          </div>
          <p className="text-sm font-semibold text-white mb-1">No memories yet</p>
          <p className="text-xs leading-relaxed" style={{ color: "#4a5568", maxWidth: 300, margin: "4px auto 0" }}>
            Add memories to give your AI workers persistent knowledge across tasks.
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e2640" }}>
          {/* Table header */}
          <div className="grid grid-cols-[200px_1fr_140px_40px] px-4 py-2.5"
            style={{ background: "#0d1120", borderBottom: "1px solid #1e2640" }}>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d3a52" }}>Key</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d3a52" }}>Content</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d3a52" }}>Scope</span>
            <span />
          </div>

          {memoryList.map((m, i) => (
            <div key={m.id}>
              {/* Row */}
              <div
                className="grid grid-cols-[200px_1fr_140px_40px] px-4 py-3 items-center cursor-pointer transition-all group"
                style={{
                  background: i % 2 === 0 ? "#0b0e18" : "#0d1120",
                  borderBottom: i < memoryList.length - 1 && expandedId !== m.id ? "1px solid #131928" : "none",
                }}
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
              >
                <code className="text-xs font-mono px-2 py-0.5 rounded inline-block truncate"
                  style={{ background: "rgba(37,99,235,0.1)", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.2)" }}>
                  {m.key}
                </code>
                <span className="text-xs truncate pr-4" style={{ color: expandedId === m.id ? "#8b95a7" : "#4a5568" }}>
                  {m.content}
                </span>
                <span className="text-xs truncate" style={{ color: "#2d3a52" }}>
                  {m.agentName ?? "Global"}
                </span>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                    disabled={deleting === m.id}
                    className="p-1.5 rounded transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    style={{ color: "#4a5568" }}
                    title="Delete memory"
                  >
                    <Trash2 className="w-3.5 h-3.5 hover:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Expanded row */}
              {expandedId === m.id && (
                <div className="px-4 py-4" style={{ background: "#0d1120", borderBottom: i < memoryList.length - 1 ? "1px solid #131928" : "none", borderTop: "1px solid #131928" }}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-white mb-2">{m.content}</p>
                  <p className="text-xs" style={{ color: "#2d3a52" }}>
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
