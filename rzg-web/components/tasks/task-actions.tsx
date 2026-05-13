"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function TaskActions({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      router.push("/dashboard/tasks");
      router.refresh();
    } catch {
      setDeleting(false);
      setConfirm(false);
    }
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
        style={{ border: "1px solid #1e2640", color: "#4a5568" }}
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: "#4a5568" }}>Delete this task?</span>
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
        onClick={() => setConfirm(false)}
        className="px-3 py-1.5 rounded-lg text-xs transition-all"
        style={{ border: "1px solid #1e2640", color: "#6b7a95" }}
      >
        Cancel
      </button>
    </div>
  );
}
