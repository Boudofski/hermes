"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play, Square, RefreshCw, CheckCircle2, AlertCircle,
  Clock, ChevronDown, ChevronUp, RotateCcw, Terminal,
  Wrench, Activity,
} from "lucide-react";

type LogEvent = {
  id: string;
  eventType: string;
  content: string;
  toolName: string | null;
  createdAt: Date;
};

type Run = {
  id: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  finalResponse: string | null;
  errorMessage: string | null;
} | null;

type HistoryRun = {
  id: string;
  status: string;
  createdAt: Date | null;
  completedAt: Date | null;
  finalResponse: string | null;
  errorMessage: string | null;
};

type ConsoleLog = { type: string; content: string; toolName?: string | null };

interface Props {
  task: { id: string; name: string; status: string };
  agent: { id: string; name: string } | null;
  initialRun: Run;
  initialLogs: LogEvent[];
  runHistory?: HistoryRun[];
}

function appendLog(prev: ConsoleLog[], next: ConsoleLog): ConsoleLog[] {
  if (next.type === "text_delta") {
    const last = prev[prev.length - 1];
    if (last?.type === "text_delta") {
      return [
        ...prev.slice(0, -1),
        { ...last, content: `${last.content}${next.content}` },
      ];
    }
  }
  return [...prev, next];
}

function normalizeLogs(logs: ConsoleLog[]): ConsoleLog[] {
  return logs.reduce<ConsoleLog[]>((acc, log) => appendLog(acc, log), []);
}

export function TaskRunner({ task, agent, initialRun, initialLogs, runHistory = [] }: Props) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<ConsoleLog[]>(
    normalizeLogs(initialLogs.map((l) => ({ type: l.eventType, content: l.content, toolName: l.toolName })))
  );
  const [finalResponse, setFinalResponse] = useState<string | null>(initialRun?.finalResponse ?? null);
  const [error, setError] = useState<string | null>(initialRun?.errorMessage ?? null);
  const [runStatus, setRunStatus] = useState(initialRun?.status ?? "idle");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // ── SSE execution — DO NOT MODIFY FETCH/STREAM/ABORT LOGIC ──
  async function handleRun() {
    setRunning(true);
    setLogs([]);
    setFinalResponse(null);
    setError(null);
    setRunStatus("running");

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch(`/api/tasks/${task.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: abort.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to start task");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;

          const raw = line.slice(5).trim();
          if (raw === "[DONE]") {
            setRunStatus("completed");
            break;
          }

          try {
            const event = JSON.parse(raw);
            if (event.type === "done") {
              setFinalResponse(event.content);
              setRunStatus("completed");
            } else if (event.type === "error") {
              setError(event.content);
              setRunStatus("failed");
            } else {
              setLogs((prev) => appendLog(prev, { type: event.type, content: event.content, toolName: event.tool_name }));
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Unknown error");
        setRunStatus("failed");
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setRunning(false);
    setRunStatus("cancelled");
  }

  const isFailed = runStatus === "failed";
  const isCancelled = runStatus === "cancelled";
  const hasResult = !!finalResponse || !!error;
  const toolEvents = logs.filter((l) => l.type === "tool_start" || l.type === "tool_end");
  const hasTextOutput = logs.some((l) => l.type === "text_delta");

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-hidden">
      <ExecutionStages
        running={running}
        hasLogs={logs.length > 0}
        hasTools={toolEvents.length > 0}
        hasTextOutput={hasTextOutput}
        hasResult={hasResult}
        failed={isFailed}
      />

      {/* ── Execution console header ── */}
      <div className="console-shell min-w-0">
        {/* Console title bar */}
        <div className="console-header">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="ml-0 flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 sm:ml-2">
              <Terminal className="h-3 w-3 shrink-0 text-cyan-200" />
              <span className="min-w-0 truncate font-mono text-xs text-slate-300">agent-execution</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {running && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
                <span className="font-mono text-xs text-cyan-100">Live</span>
              </div>
            )}
            {toolEvents.length > 0 && !running && (
              <div className="flex items-center gap-1.5">
                <Wrench className="h-3 w-3 text-cyan-200" />
                <span className="text-xs font-semibold text-slate-300">{Math.floor(toolEvents.length / 2)} tool calls</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/[0.025] px-4 py-3">
          {!running ? (
            <>
              {(isFailed || isCancelled) ? (
                <button
                  onClick={handleRun}
                  disabled={!agent}
                  className="button-primary px-3 py-2 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry
                </button>
              ) : (
                <button
                  onClick={handleRun}
                  disabled={!agent}
                  className="button-primary px-3 py-2 text-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run Now
                </button>
              )}
              {hasResult && !(isFailed || isCancelled) && (
                <button
                  onClick={handleRun}
                  className="button-secondary px-3 py-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-run
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleStop}
              className="button-danger px-3 py-2 text-xs"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
          )}

          <StatusPill status={runStatus} running={running} />

          {!agent && (
            <span className="text-xs font-semibold text-slate-300">No AI worker assigned</span>
          )}
        </div>

        {/* Log lines */}
        {(logs.length > 0 || running) && (
          <div className="console-body max-h-96 max-w-full space-y-1 overflow-x-auto overflow-y-auto p-4">
            {logs.map((log, i) => (
              <LogLine key={i} log={log} />
            ))}
            {running && logs.length === 0 && (
              <div className="flex items-center gap-2 log-sys">
                <span>Initializing agent</span>
                <span className="cursor-blink text-blue-400">▋</span>
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        )}

        {/* Empty / idle state inside console */}
        {!running && logs.length === 0 && !finalResponse && !error && (
          <div className="p-10 text-center">
            <div className="brand-mark mx-auto mb-3 h-10 w-10">
              <Activity className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              No runs yet. Click <span className="text-white">Run Now</span> to execute.
            </p>
          </div>
        )}
      </div>

      {/* ── Error panel ── */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300/30 bg-red-500/10 p-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-100" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-100">Run failed</p>
            <p className="mt-1 break-words text-sm leading-6 text-slate-200">{error}</p>
          </div>
        </div>
      )}

      {/* ── Final output panel ── */}
      {finalResponse && (
        <div className="surface-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span className="eyebrow">Final Output</span>
          </div>
          <div className="p-5">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-100">{finalResponse}</pre>
          </div>
        </div>
      )}

      {/* ── Run history ── */}
      {runHistory.length > 0 && (
        <RunHistory runs={runHistory} />
      )}
    </div>
  );
}

function ExecutionStages({
  running,
  hasLogs,
  hasTools,
  hasTextOutput,
  hasResult,
  failed,
}: {
  running: boolean;
  hasLogs: boolean;
  hasTools: boolean;
  hasTextOutput: boolean;
  hasResult: boolean;
  failed: boolean;
}) {
  const stages = [
    { label: "Reading task", done: hasLogs || hasResult, active: running && !hasLogs },
    { label: "Loading memory", done: hasLogs || hasResult, active: running && hasLogs && !hasTextOutput && !hasTools },
    { label: "Planning", done: hasTextOutput || hasTools || hasResult, active: running && hasLogs && !hasTextOutput && !hasTools },
    { label: "Executing tools", done: hasTools && !running, active: running && hasTools, note: "Tool-capable when worker/toolsets are configured" },
    { label: "Formatting output", done: hasResult, active: running && hasTextOutput },
    { label: "Saving result", done: hasResult && !failed, active: running && hasTextOutput && !hasResult },
  ];

  return (
    <div className="surface-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">Execution Stages</p>
        <span className="text-xs font-semibold text-slate-300">Live stage view</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        {stages.map((stage) => (
          <div key={stage.label} className={`rounded-xl border px-3 py-3 ${stage.active ? "border-cyan-300/40 bg-cyan-300/10" : stage.done ? "border-emerald-300/25 bg-emerald-400/10" : "border-white/10 bg-white/[0.025]"}`}>
            <div className="flex items-center gap-2">
              {stage.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" />
              ) : (
                <Clock className={`h-4 w-4 shrink-0 ${stage.active ? "animate-spin text-cyan-200" : "text-slate-400"}`} />
              )}
              <p className="truncate text-xs font-bold text-white">{stage.label}</p>
            </div>
            {stage.note && <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-300">{stage.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RunHistory({ runs }: { runs: HistoryRun[] }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  return (
    <div className="surface-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 border-b border-white/10 px-5 py-4 transition hover:bg-white/[0.035]"
      >
        <Clock className="h-4 w-4 text-cyan-200" />
        <span className="eyebrow flex-1 text-left">
          Run History
        </span>
        <span className="badge badge-muted mr-1">{runs.length}</span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />}
      </button>

      {expanded && (
        <div className="divide-y divide-white/10">
          {runs.map((run, i) => (
            <div key={run.id} className="space-y-2 bg-white/[0.02] p-4">
              <button
                type="button"
                onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                className="flex w-full min-w-0 flex-col gap-3 text-left sm:flex-row sm:items-center"
              >
                <HistoryDot status={run.status} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-white">Run #{runs.length - i}</span>
                  <span className="ml-0 block break-words text-xs font-medium text-slate-300 sm:ml-2 sm:inline">
                    {run.createdAt ? new Date(run.createdAt).toLocaleString() : "—"}
                  </span>
                </div>
                <span className={`${historyBadgeClass(run.status)} self-start sm:self-auto`}>{run.status}</span>
                {(run.finalResponse || run.errorMessage) && (
                  expandedRun === run.id
                    ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
                    : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
                )}
              </button>

              {expandedRun === run.id && run.finalResponse && (
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 sm:ml-5">
                  <pre className="line-clamp-10 whitespace-pre-wrap break-words font-sans text-xs leading-6 text-slate-300">
                    {run.finalResponse}
                  </pre>
                </div>
              )}

              {expandedRun === run.id && run.errorMessage && (
                <div className="rounded-xl border border-red-300/30 bg-red-500/10 p-3 sm:ml-5">
                  <p className="break-words text-xs text-red-100">{run.errorMessage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function historyBadgeClass(status: string): string {
  const map: Record<string, string> = {
    completed: "badge badge-green",
    failed:    "badge badge-red",
    cancelled: "badge badge-muted",
    running:   "badge badge-yellow",
    pending:   "badge badge-muted",
  };
  return map[status] ?? map.pending;
}

function HistoryDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-green-500",
    failed:    "bg-red-500",
    cancelled: "bg-muted-foreground/30",
    running:   "bg-yellow-400",
    pending:   "bg-muted-foreground/30",
  };
  return <div className={`w-2 h-2 rounded-full shrink-0 ${colors[status] ?? colors.pending}`} />;
}

function LogLine({ log }: { log: ConsoleLog }) {
  if (log.type === "tool_start") {
    return (
      <div className="exec-line log-tool">
        <span className="log-sys shrink-0">▶</span>
        <span className="break-words">{log.toolName ?? log.content}</span>
        <span className="log-sys text-xs">starting...</span>
      </div>
    );
  }
  if (log.type === "tool_end") {
    return (
      <div className="exec-line log-done">
        <span className="log-sys shrink-0">✓</span>
        <span className="break-words">{log.toolName ?? log.content}</span>
      </div>
    );
  }
  if (log.type === "text_delta") {
    return <div className="whitespace-pre-wrap break-words font-sans text-sm leading-7 log-out">{log.content}</div>;
  }
  return (
    <div className="exec-line log-sys">
      <span className="text-blue-400/40 shrink-0">•</span>
      <span className="break-words">{log.content}</span>
    </div>
  );
}

function StatusPill({ status, running }: { status: string; running: boolean }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    idle:      { cls: "badge badge-muted",   label: "Idle" },
    running:   { cls: "badge badge-yellow",  label: "Running" },
    completed: { cls: "badge badge-green",   label: "Completed" },
    failed:    { cls: "badge badge-red",     label: "Failed" },
    cancelled: { cls: "badge badge-muted",   label: "Cancelled" },
  };
  const { cls, label } = cfg[status] ?? cfg.idle;
  return (
    <span className={cls}>
      {running
        ? <Clock className="w-3 h-3 animate-spin" />
        : status === "completed"
        ? <CheckCircle2 className="w-3 h-3" />
        : status === "failed"
        ? <AlertCircle className="w-3 h-3" />
        : <Clock className="w-3 h-3" />}
      {label}
    </span>
  );
}
