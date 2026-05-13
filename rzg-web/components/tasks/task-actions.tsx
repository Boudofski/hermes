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
        className="button-danger px-3 py-2 text-xs"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 p-2">
      <span className="px-2 text-xs font-semibold text-red-100">Delete this task?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="button-danger px-3 py-2 text-xs"
      >
        {deleting ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="button-secondary px-3 py-2 text-xs"
      >
        Cancel
      </button>
    </div>
  );
}
