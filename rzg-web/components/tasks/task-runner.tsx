"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Square, RefreshCw, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

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
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {!running ? (
          <>
            {(isFailed || isCancelled) ? (
              <button
                onClick={handleRun}
                disabled={!agent}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </button>
            ) : (
              <button
                onClick={handleRun}
                disabled={!agent}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Run Now
              </button>
            )}

            {hasResult && !(isFailed || isCancelled) && (
              <button
                onClick={handleRun}
                className="flex items-center gap-2 px-3 py-2 border border-border hover:bg-secondary text-sm rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-run
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/80 hover:bg-destructive text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        )}

        <StatusPill status={runStatus} />

        {!agent && (
          <span className="text-xs text-muted-foreground">No AI worker assigned</span>
        )}
      </div>

      {/* Log viewer */}
      {logs.length > 0 && (
        <div className="bg-[hsl(222,47%,3%)] border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${running ? "bg-blue-400 animate-pulse" : "bg-muted-foreground"}`} />
            <span className="text-xs font-mono text-muted-foreground">Agent Activity</span>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <LogLine key={i} log={log} />
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Run failed</p>
            <p className="text-xs text-muted-foreground mt-0.5 break-words">{error}</p>
          </div>
        </div>
      )}

      {/* Final output */}
      {finalResponse && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">Output</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{finalResponse}</pre>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!running && logs.length === 0 && !finalResponse && !error && (
        <div className="border border-dashed border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No runs yet. Click <strong>Run Now</strong> to execute this task.
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
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        <span className="text-xs font-medium text-muted-foreground">
          Run History ({runs.length} previous run{runs.length !== 1 ? "s" : ""})
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {runs.map((run, i) => (
            <div key={run.id} className="p-3 space-y-2">
              <button
                type="button"
                onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                className="w-full flex items-center gap-3 text-left"
              >
                <StatusDot status={run.status} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">Run #{runs.length - i}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {run.createdAt ? new Date(run.createdAt).toLocaleString() : "—"}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusChip(run.status)}`}>
                  {run.status}
                </span>
                {(run.finalResponse || run.errorMessage) && (
                  expandedRun === run.id
                    ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
              </button>

              {expandedRun === run.id && run.finalResponse && (
                <div className="ml-5 bg-card rounded-lg p-3">
                  <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-muted-foreground line-clamp-10">
                    {run.finalResponse}
                  </pre>
                </div>
              )}

              {expandedRun === run.id && run.errorMessage && (
                <div className="ml-5 bg-destructive/10 rounded-lg p-3">
                  <p className="text-xs text-destructive">{run.errorMessage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function statusChip(status: string) {
  const map: Record<string, string> = {
    completed: "bg-green-400/10 text-green-400",
    failed: "bg-destructive/10 text-destructive",
    cancelled: "bg-secondary text-muted-foreground",
    running: "bg-yellow-400/10 text-yellow-400",
    pending: "bg-secondary text-muted-foreground",
  };
  return map[status] ?? map.pending;
}

function StatusDot({ status }: { status: string }) {
  const color: Record<string, string> = {
    completed: "bg-green-400",
    failed: "bg-destructive",
    cancelled: "bg-muted-foreground",
    running: "bg-yellow-400",
    pending: "bg-muted-foreground",
  };
  return <div className={`w-2 h-2 rounded-full shrink-0 ${color[status] ?? color.pending}`} />;
}

function LogLine({ log }: { log: { type: string; content: string; toolName?: string | null } }) {
  if (log.type === "tool_start") {
    return (
      <div className="text-violet-400">
        <span className="text-muted-foreground">▶ </span>
        {log.toolName ?? log.content}
        <span className="text-muted-foreground ml-1">starting…</span>
      </div>
    );
  }
  if (log.type === "tool_end") {
    return (
      <div className="text-green-400/70">
        <span className="text-muted-foreground">✓ </span>
        {log.toolName ?? log.content}
      </div>
    );
  }
  if (log.type === "text_delta") {
    return <div className="text-foreground">{log.content}</div>;
  }
  return (
    <div className="text-muted-foreground">
      <span className="text-blue-400/60">• </span>
      {log.content}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    idle: { label: "Idle", cls: "text-muted-foreground bg-secondary", icon: <Clock className="w-3 h-3" /> },
    running: { label: "Running", cls: "text-yellow-400 bg-yellow-400/10", icon: <Clock className="w-3 h-3 animate-spin" /> },
    completed: { label: "Completed", cls: "text-green-400 bg-green-400/10", icon: <CheckCircle2 className="w-3 h-3" /> },
    failed: { label: "Failed", cls: "text-destructive bg-destructive/10", icon: <AlertCircle className="w-3 h-3" /> },
    cancelled: { label: "Cancelled", cls: "text-muted-foreground bg-secondary", icon: <Square className="w-3 h-3" /> },
  };
  const { label, cls, icon } = cfg[status] ?? cfg.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {icon}
      {label}
    </span>
  );
}
