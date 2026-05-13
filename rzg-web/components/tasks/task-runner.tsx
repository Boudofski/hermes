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
  const toolEvents = logs.filter((l) => l.type === "tool_start" || l.type === "tool_end");

  return (
    <div className="space-y-4">
      {/* ── Execution console header ── */}
      <div className="exec-console">
        {/* Console title bar */}
        <div className="panel-header-dark justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex items-center gap-2 px-3 py-0.5 rounded bg-white/4 border border-white/6 ml-2">
              <Terminal className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-xs font-mono text-muted-foreground/50">agent-execution</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {running && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
                <span className="text-xs font-mono text-blue-400">Live</span>
              </div>
            )}
            {toolEvents.length > 0 && !running && (
              <div className="flex items-center gap-1.5">
                <Wrench className="w-3 h-3 text-violet-400" />
                <span className="text-xs text-muted-foreground/50">{Math.floor(toolEvents.length / 2)} tool calls</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#131928] bg-[#06080e] flex-wrap">
          {!running ? (
            <>
              {(isFailed || isCancelled) ? (
                <button
                  onClick={handleRun}
                  disabled={!agent}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry
                </button>
              ) : (
                <button
                  onClick={handleRun}
                  disabled={!agent}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  Run Now
                </button>
              )}
              {hasResult && !(isFailed || isCancelled) && (
                <button
                  onClick={handleRun}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-run
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
          )}

          <StatusPill status={runStatus} running={running} />

          {!agent && (
            <span className="text-xs text-muted-foreground">No AI worker assigned</span>
          )}
        </div>

        {/* Log lines */}
        {(logs.length > 0 || running) && (
          <div className="p-4 max-h-80 overflow-y-auto space-y-0.5 terminal-row">
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
            <div className="w-9 h-9 rounded-xl bg-white/4 border border-white/6 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-4.5 h-4.5 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-muted-foreground/50">
              No runs yet — click <span className="text-white">Run Now</span> to execute
            </p>
          </div>
        )}
      </div>

      {/* ── Error panel ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/6 border border-red-500/20">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-red-500/12">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-400">Run failed</p>
            <p className="text-xs mt-0.5 break-words text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* ── Final output panel ── */}
      {finalResponse && (
        <div className="panel rounded-xl overflow-hidden">
          <div className="panel-header">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Output
            </span>
          </div>
          <div className="p-5">
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{finalResponse}</pre>
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

// ── Sub-components ────────────────────────────────────────────────────────────

function RunHistory({ runs }: { runs: HistoryRun[] }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  return (
    <div className="panel rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full panel-header hover:bg-white/2 transition-colors"
      >
        <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
        <span className="flex-1 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          Run History
        </span>
        <span className="badge badge-muted mr-1">{runs.length}</span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />}
      </button>

      {expanded && (
        <div className="divide-y divide-border/60">
          {runs.map((run, i) => (
            <div key={run.id} className="p-3 space-y-2 bg-card/40">
              <button
                type="button"
                onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                className="w-full flex items-center gap-3 text-left"
              >
                <HistoryDot status={run.status} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">Run #{runs.length - i}</span>
                  <span className="text-xs text-muted-foreground/50 ml-2">
                    {run.createdAt ? new Date(run.createdAt).toLocaleString() : "—"}
                  </span>
                </div>
                <span className={historyBadgeClass(run.status)}>{run.status}</span>
                {(run.finalResponse || run.errorMessage) && (
                  expandedRun === run.id
                    ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
                    : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
                )}
              </button>

              {expandedRun === run.id && run.finalResponse && (
                <div className="ml-5 panel-dark rounded-lg p-3">
                  <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed line-clamp-10 text-muted-foreground">
                    {run.finalResponse}
                  </pre>
                </div>
              )}

              {expandedRun === run.id && run.errorMessage && (
                <div className="ml-5 rounded-lg p-3 bg-red-500/6 border border-red-500/20">
                  <p className="text-xs text-red-400">{run.errorMessage}</p>
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

function LogLine({ log }: { log: { type: string; content: string; toolName?: string | null } }) {
  if (log.type === "tool_start") {
    return (
      <div className="exec-line log-tool">
        <span className="log-sys shrink-0">▶</span>
        <span>{log.toolName ?? log.content}</span>
        <span className="log-sys text-xs">starting…</span>
      </div>
    );
  }
  if (log.type === "tool_end") {
    return (
      <div className="exec-line log-done">
        <span className="log-sys shrink-0">✓</span>
        <span>{log.toolName ?? log.content}</span>
      </div>
    );
  }
  if (log.type === "text_delta") {
    return <div className="leading-relaxed log-out">{log.content}</div>;
  }
  return (
    <div className="exec-line log-sys">
      <span className="text-blue-400/40 shrink-0">•</span>
      <span>{log.content}</span>
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
