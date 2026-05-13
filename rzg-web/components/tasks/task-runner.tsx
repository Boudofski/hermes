"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play, Square, RefreshCw, CheckCircle2, AlertCircle,
  Clock, ChevronDown, ChevronUp, RotateCcw,
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

interface Props {
  task: { id: string; name: string; status: string };
  agent: { id: string; name: string } | null;
  initialRun: Run;
  initialLogs: LogEvent[];
  runHistory?: HistoryRun[];
}

export function TaskRunner({ task, agent, initialRun, initialLogs, runHistory = [] }: Props) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<Array<{ type: string; content: string; toolName?: string | null }>>(
    initialLogs.map((l) => ({ type: l.eventType, content: l.content, toolName: l.toolName }))
  );
  const [finalResponse, setFinalResponse] = useState<string | null>(initialRun?.finalResponse ?? null);
  const [error, setError] = useState<string | null>(initialRun?.errorMessage ?? null);
  const [runStatus, setRunStatus] = useState(initialRun?.status ?? "idle");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

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
              setLogs((prev) => [...prev, { type: event.type, content: event.content, toolName: event.tool_name }]);
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

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        {!running ? (
          <>
            {(isFailed || isCancelled) ? (
              <button
                onClick={handleRun}
                disabled={!agent}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "#1d4ed8" }}
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
            ) : (
              <button
                onClick={handleRun}
                disabled={!agent}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "#1d4ed8" }}
              >
                <Play className="w-4 h-4" />
                Run Now
              </button>
            )}

            {hasResult && !(isFailed || isCancelled) && (
              <button
                onClick={handleRun}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                style={{ border: "1px solid #1e2640", color: "#6b7a95" }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-run
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: "rgba(220,38,38,0.8)" }}
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        )}

        <StatusPill status={runStatus} running={running} />

        {!agent && (
          <span className="text-xs" style={{ color: "#4a5568" }}>No AI worker assigned</span>
        )}
      </div>

      {/* Terminal window */}
      {(logs.length > 0 || running) && (
        <div className="rounded-xl overflow-hidden" style={{ background: "#06080e", border: "1px solid #1a2035" }}>
          {/* macOS chrome */}
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #0f1520", background: "#080b12" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2 px-3 py-0.5 rounded" style={{ background: "#0d1120", border: "1px solid #1a2035" }}>
                <span className="text-xs font-mono" style={{ color: "#3a4455" }}>agent-execution</span>
              </div>
            </div>
            {running && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
                <span className="text-xs font-mono" style={{ color: "#3b82f6" }}>Live</span>
              </div>
            )}
          </div>

          {/* Log lines */}
          <div className="p-4 max-h-80 overflow-y-auto space-y-1 terminal-row">
            {logs.map((log, i) => (
              <LogLine key={i} log={log} />
            ))}
            {running && logs.length === 0 && (
              <div className="flex items-center gap-2" style={{ color: "#3a4455" }}>
                <span className="text-xs">Initializing agent</span>
                <span className="cursor-blink text-blue-400">▋</span>
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(239,68,68,0.12)" }}>
            <AlertCircle className="w-3.5 h-3.5" style={{ color: "#f87171" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: "#f87171" }}>Run failed</p>
            <p className="text-xs mt-0.5 break-words" style={{ color: "#4a5568" }}>{error}</p>
          </div>
        </div>
      )}

      {/* Final output */}
      {finalResponse && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)" }}>
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
            </div>
            <span className="text-sm font-semibold text-white">Output</span>
          </div>
          <div className="rounded-xl p-5" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-white">{finalResponse}</pre>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!running && logs.length === 0 && !finalResponse && !error && (
        <div className="rounded-xl p-10 text-center" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "#0d1120", border: "1px solid #1e2640" }}>
            <Play className="w-5 h-5" style={{ color: "#3a4455" }} />
          </div>
          <p className="text-sm" style={{ color: "#4a5568" }}>
            No runs yet. Click <strong className="text-white">Run Now</strong> to execute this task.
          </p>
        </div>
      )}

      {/* Run history */}
      {runHistory.length > 0 && (
        <RunHistory runs={runHistory} />
      )}
    </div>
  );
}

function RunHistory({ runs }: { runs: HistoryRun[] }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e2640" }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-all"
        style={{ background: "#0b0e18" }}
      >
        <span className="text-xs font-medium" style={{ color: "#4a5568" }}>
          Run History ({runs.length} previous run{runs.length !== 1 ? "s" : ""})
        </span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5" style={{ color: "#3a4455" }} />
          : <ChevronDown className="w-3.5 h-3.5" style={{ color: "#3a4455" }} />}
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid #131928" }}>
          {runs.map((run, i) => (
            <div key={run.id} className="p-3 space-y-2" style={{ borderBottom: i < runs.length - 1 ? "1px solid #131928" : "none", background: "#0d1120" }}>
              <button
                type="button"
                onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                className="w-full flex items-center gap-3 text-left"
              >
                <StatusDot status={run.status} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-white">Run #{runs.length - i}</span>
                  <span className="text-xs ml-2" style={{ color: "#2d3a52" }}>
                    {run.createdAt ? new Date(run.createdAt).toLocaleString() : "—"}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={statusChipStyle(run.status)}>
                  {run.status}
                </span>
                {(run.finalResponse || run.errorMessage) && (
                  expandedRun === run.id
                    ? <ChevronUp className="w-3.5 h-3.5 shrink-0" style={{ color: "#3a4455" }} />
                    : <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: "#3a4455" }} />
                )}
              </button>

              {expandedRun === run.id && run.finalResponse && (
                <div className="ml-5 rounded-xl p-3" style={{ background: "#0b0e18", border: "1px solid #1e2640" }}>
                  <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed line-clamp-10" style={{ color: "#6b7a95" }}>
                    {run.finalResponse}
                  </pre>
                </div>
              )}

              {expandedRun === run.id && run.errorMessage && (
                <div className="ml-5 rounded-xl p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <p className="text-xs" style={{ color: "#f87171" }}>{run.errorMessage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function statusChipStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    completed: { background: "rgba(34,197,94,0.1)", color: "#22c55e" },
    failed:    { background: "rgba(239,68,68,0.1)", color: "#ef4444" },
    cancelled: { background: "rgba(74,85,104,0.1)", color: "#4a5568" },
    running:   { background: "rgba(245,158,11,0.1)", color: "#f59e0b" },
    pending:   { background: "rgba(74,85,104,0.1)", color: "#4a5568" },
  };
  return map[status] ?? map.pending;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "#22c55e",
    failed: "#ef4444",
    cancelled: "#4a5568",
    running: "#f59e0b",
    pending: "#4a5568",
  };
  return <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[status] ?? colors.pending }} />;
}

function LogLine({ log }: { log: { type: string; content: string; toolName?: string | null } }) {
  if (log.type === "tool_start") {
    return (
      <div className="flex items-baseline gap-1.5" style={{ color: "#a78bfa" }}>
        <span style={{ color: "rgba(74,85,104,0.6)" }} className="shrink-0">▶</span>
        <span>{log.toolName ?? log.content}</span>
        <span style={{ color: "rgba(74,85,104,0.6)" }} className="text-xs">starting…</span>
      </div>
    );
  }
  if (log.type === "tool_end") {
    return (
      <div className="flex items-baseline gap-1.5" style={{ color: "rgba(34,197,94,0.7)" }}>
        <span style={{ color: "rgba(74,85,104,0.6)" }} className="shrink-0">✓</span>
        <span>{log.toolName ?? log.content}</span>
      </div>
    );
  }
  if (log.type === "text_delta") {
    return <div className="leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{log.content}</div>;
  }
  return (
    <div className="flex items-baseline gap-1.5" style={{ color: "#4a5568" }}>
      <span style={{ color: "rgba(59,130,246,0.5)" }} className="shrink-0">•</span>
      <span>{log.content}</span>
    </div>
  );
}

function StatusPill({ status, running }: { status: string; running: boolean }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    idle:      { label: "Idle",      color: "#4a5568", bg: "rgba(74,85,104,0.12)" },
    running:   { label: "Running",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    completed: { label: "Completed", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    failed:    { label: "Failed",    color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    cancelled: { label: "Cancelled", color: "#4a5568", bg: "rgba(74,85,104,0.12)" },
  };
  const { label, color, bg } = cfg[status] ?? cfg.idle;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ color, background: bg }}>
      {running
        ? <Clock className="w-3 h-3 animate-spin" />
        : status === "completed"
        ? <CheckCircle2 className="w-3 h-3" />
        : status === "failed"
        ? <AlertCircle className="w-3 h-3" />
        : <Clock className="w-3 h-3" />
      }
      {label}
    </span>
  );
}
