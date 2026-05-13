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
        className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 hover:border-red-500/30 text-muted-foreground hover:text-red-400 rounded-lg text-xs transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Delete this task?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
      >
        {deleting ? "Deleting…" : "Yes"}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="px-3 py-1.5 border border-white/10 rounded-lg text-xs hover:bg-white/5 transition-all"
      >
        Cancel
      </button>
    </div>
  );
}
