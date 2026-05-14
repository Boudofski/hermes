"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, FileText, Loader2, Radio, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

type Worker = {
  id: string;
  name: string;
  role: string;
  goal: string;
  model: string;
  memoryEnabled: boolean;
};

const OUTPUT_TYPES = [
  "Report",
  "Checklist",
  "Strategy",
  "Table",
  "Email",
  "Social Content",
  "Automation Plan",
];

function missionName(outputType: string, request: string): string {
  const firstLine = request.split("\n").find(Boolean)?.trim() ?? "Command mission";
  const clean = firstLine.replace(/\s+/g, " ").slice(0, 80);
  return `${outputType}: ${clean || "Command mission"}`;
}

export function CommandCenterForm({ workers }: { workers: Worker[] }) {
  const router = useRouter();
  const [workerId, setWorkerId] = useState(workers[0]?.id ?? "");
  const [outputType, setOutputType] = useState(OUTPUT_TYPES[0]);
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedWorker = useMemo(
    () => workers.find((worker) => worker.id === workerId) ?? workers[0],
    [workerId, workers]
  );

  async function executeMission(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWorker) return;

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedWorker.id,
          name: missionName(outputType, request),
          prompt: `Output type: ${outputType}\n\n${request}`,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to create mission");
      }

      router.push(`/dashboard/tasks/${data.id}?autorun=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute mission");
      setLoading(false);
    }
  }

  if (workers.length === 0) {
    return (
      <div className="surface-panel p-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="brand-mark mx-auto mb-4 h-12 w-12">
            <Bot className="h-6 w-6" />
          </div>
          <p className="eyebrow">No Workers Available</p>
          <h2 className="mt-2 text-2xl font-black text-white">Create an AI worker before executing commands</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Command Center routes requests through real workers, creates a task, and launches the execution stream.
          </p>
          <Link href="/dashboard/agents/new" className="button-primary mt-6 inline-flex">
            <Bot className="h-4 w-4" />
            Create Worker
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={executeMission} className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="surface-panel min-w-0 overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="eyebrow">Mission Request</p>
          <h2 className="mt-1 text-xl font-black text-white">Tell RZG what to execute</h2>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="label-premium">AI Worker</label>
              <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="input-premium">
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} - {worker.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="label-premium">Output Type</label>
              <select value={outputType} onChange={(e) => setOutputType(e.target.value)} className="input-premium">
                {OUTPUT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="label-premium">Request</label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              required
              rows={12}
              placeholder="Audit https://example.com and prioritize conversion, SEO, trust signals, and next actions."
              className="input-premium min-h-72 resize-y"
            />
            <p className="helper-text">RZG will create a task behind the scenes and open the live execution console.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" disabled={loading || !request.trim()} className="button-primary px-5 py-3">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {loading ? "Launching mission..." : "Execute Mission"}
            </button>
            <Link href="/dashboard/tasks" className="button-secondary px-5 py-3">
              View Task History
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <aside className="min-w-0 space-y-4">
        {selectedWorker && (
          <div className="surface-card p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="brand-mark h-11 w-11">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="eyebrow">Selected Worker</p>
                <h3 className="mt-1 truncate text-lg font-black text-white">{selectedWorker.name}</h3>
              </div>
            </div>
            <InfoRow label="Role" value={selectedWorker.role} />
            <InfoRow label="Goal" value={selectedWorker.goal} />
            <InfoRow label="Model" value={selectedWorker.model.split("/").pop() ?? selectedWorker.model} />
            <InfoRow label="Memory" value={selectedWorker.memoryEnabled ? "Enabled" : "Disabled"} />
          </div>
        )}

        <div className="metal-panel p-5">
          <p className="eyebrow">Execution Path</p>
          <div className="mt-4 space-y-3">
            <PathStep icon={<Sparkles className="h-4 w-4" />} title="Create task" detail="The command is saved as a normal task for history." />
            <PathStep icon={<Radio className="h-4 w-4" />} title="Open console" detail="RZG redirects to the task detail page with autorun enabled." />
            <PathStep icon={<FileText className="h-4 w-4" />} title="Save result" detail="The final output remains attached to the task run." />
          </div>
        </div>
      </aside>
    </form>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/10 py-3 first:border-t-0 first:pt-0">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-200">{value}</p>
    </div>
  );
}

function PathStep({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex min-w-0 gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-white">{title}</p>
        <p className="mt-1 break-words text-xs leading-5 text-slate-300">{detail}</p>
      </div>
    </div>
  );
}
