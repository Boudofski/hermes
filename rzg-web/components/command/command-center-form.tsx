"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  FileText,
  Globe2,
  Loader2,
  Radio,
  Search,
  Settings2,
  Sparkles,
  Target,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";

type Worker = {
  id: string;
  name: string;
  role: string;
  goal: string;
  model: string;
  memoryEnabled: boolean;
};

type WorkerKind = "website" | "competitor" | "proposal" | "automation" | "seo" | "content" | "general";

const OUTPUT_TYPES = [
  "Report",
  "Checklist",
  "Strategy",
  "Table",
  "Email",
  "Social Content",
  "Automation Plan",
];

const WORKFLOW_SHORTCUTS = [
  {
    kind: "website" as WorkerKind,
    title: "Website Audit",
    outputType: "Report",
    icon: Globe2,
    prompt: "Audit https://example.com. Inspect SEO structure, conversion clarity, trust signals, accessibility issues, content quality, and priority fixes. Return a ranked action plan.",
  },
  {
    kind: "competitor" as WorkerKind,
    title: "Competitor Intelligence",
    outputType: "Strategy",
    icon: Search,
    prompt: "Compare these competitors:\nhttps://competitor-one.com\nhttps://competitor-two.com\nhttps://competitor-three.com\n\nExtract positioning, CTAs, offers, messaging gaps, and recommend a differentiation strategy.",
  },
  {
    kind: "proposal" as WorkerKind,
    title: "Client Proposal",
    outputType: "Report",
    icon: FileText,
    prompt: "Build a client-ready proposal for:\nClient/business: [client name]\nIndustry: [industry]\nRequested service: [service]\nPain points: [pain points]\nGoals: [goals]\nTimeline: [timeline]\nBudget: [budget if known]\n\nUse business memory for services, pricing, brand voice, positioning, and SOPs.",
  },
  {
    kind: "automation" as WorkerKind,
    title: "Automation Audit",
    outputType: "Automation Plan",
    icon: Settings2,
    prompt: "Audit this business process for automation opportunities:\nProcess: [describe workflow]\nCurrent tools: [tools]\nManual steps: [steps]\nPain points: [issues]\nDesired outcome: [goal]\n\nReturn automation opportunities, priority, required inputs, and implementation plan.",
  },
];

function missionName(outputType: string, request: string): string {
  const firstLine = request.split("\n").find(Boolean)?.trim() ?? "Command mission";
  const clean = firstLine.replace(/\s+/g, " ").slice(0, 80);
  return `${outputType}: ${clean || "Command mission"}`;
}

function workerKind(worker?: Worker | null): WorkerKind {
  if (!worker) return "general";
  const haystack = `${worker.name} ${worker.role} ${worker.goal}`.toLowerCase();
  if (haystack.includes("website") && haystack.includes("audit")) return "website";
  if (haystack.includes("competitor")) return "competitor";
  if (haystack.includes("proposal")) return "proposal";
  if (haystack.includes("automation")) return "automation";
  if (haystack.includes("seo")) return "seo";
  if (haystack.includes("content") || haystack.includes("instagram")) return "content";
  return "general";
}

function bestWorkerFor(workers: Worker[], kind: WorkerKind): Worker | undefined {
  return workers.find((worker) => workerKind(worker) === kind) ?? workers[0];
}

function placeholderFor(kind: WorkerKind): string {
  const map: Record<WorkerKind, string> = {
    website: "Audit https://example.com for SEO, conversion clarity, trust signals, accessibility, and the top 10 fixes.",
    competitor: "Compare https://competitor-one.com, https://competitor-two.com, and https://competitor-three.com. Identify positioning gaps and strategic opportunities.",
    proposal: "Build a proposal for Client: Acme Dental. They need SEO and website conversion improvements. Include scope, timeline, deliverables, and pricing placeholders if pricing memory is missing.",
    automation: "Audit our lead intake workflow. Identify manual steps, automation opportunities, tools needed, risks, and a 30-day implementation plan.",
    seo: "Create an SEO strategy for [site/topic]. Include keyword themes, content gaps, technical risks, and a 30-day execution plan.",
    content: "Create a 2-week Instagram content plan for [brand]. Include post ideas, hooks, captions, CTA strategy, and production notes.",
    general: "Describe the business outcome you want. Include context, constraints, source URLs if relevant, and the final format you expect.",
  };
  return map[kind];
}

function examplesFor(kind: WorkerKind): string[] {
  const map: Record<WorkerKind, string[]> = {
    website: [
      "Audit https://example.com and rank the top conversion, SEO, and trust-signal fixes.",
      "Review https://example.com for homepage clarity, H1/H2 structure, metadata, and missing accessibility basics.",
      "Inspect https://example.com and produce a client-ready website improvement plan.",
    ],
    competitor: [
      "Compare https://competitor-one.com, https://competitor-two.com, and https://competitor-three.com for positioning and offer gaps.",
      "Analyze these 3 competitors and create a differentiation strategy with recommended next actions.",
      "Build a competitor matrix from these URLs and identify messaging opportunities we can own.",
    ],
    proposal: [
      "Build a proposal for Client: [name]. Industry: [industry]. Need: [service]. Pain points: [problems]. Goals: [goals].",
      "Turn this discovery brief into a client-ready proposal with scope, timeline, deliverables, and next steps.",
      "Create a premium proposal for a website audit and SEO strategy engagement using business memory.",
    ],
    automation: [
      "Audit this onboarding process and identify automation opportunities, tools, risks, and first steps.",
      "Create an automation plan for lead intake from form submission to CRM follow-up.",
      "Find repetitive operations tasks in this workflow and rank them by impact and complexity.",
    ],
    seo: [
      "Create an SEO strategy for [business] targeting [audience] in [location or niche].",
      "Build a blog plan with keyword clusters, titles, search intent, and publishing priority.",
      "Audit this page topic and recommend internal links, content gaps, and schema opportunities.",
    ],
    content: [
      "Create an Instagram content strategy for [brand] with hooks, captions, and post formats.",
      "Plan 10 social posts for [offer] targeting [audience], with CTAs and creative direction.",
      "Turn this offer into a 2-week content calendar with daily themes and production notes.",
    ],
    general: [
      "Research this market and create a concise executive brief with risks and opportunities.",
      "Turn these notes into an action plan with owners, sequence, and deliverables.",
      "Create a decision memo comparing the options and recommending next steps.",
    ],
  };
  return map[kind];
}

function bestUseCase(kind: WorkerKind): string {
  const map: Record<WorkerKind, string> = {
    website: "Best for URL-based audits with SEO, conversion, trust, and accessibility recommendations.",
    competitor: "Best for comparing multiple competitor URLs and producing positioning strategy.",
    proposal: "Best for turning client briefs and business memory into polished proposals.",
    automation: "Best for finding repeatable workflows, manual handoffs, and automation plans.",
    seo: "Best for search strategy, blog planning, keyword themes, and content opportunities.",
    content: "Best for social campaigns, captions, content calendars, and creative direction.",
    general: "Best for broad research, operations requests, summaries, and structured business output.",
  };
  return map[kind];
}

function outputSections(kind: WorkerKind, outputType: string): string[] {
  if (kind === "proposal") return ["Proposal title", "Client problem", "Recommended solution", "Scope", "Timeline", "Pricing", "Next steps"];
  if (kind === "competitor") return ["Competitor matrix", "Positioning gaps", "Offer opportunities", "Differentiation", "Next actions"];
  if (kind === "website") return ["Audit summary", "SEO issues", "Conversion fixes", "Trust signals", "Priority action plan"];
  if (kind === "automation") return ["Workflow map", "Automation opportunities", "Tooling", "Risks", "Implementation plan"];
  if (outputType === "Checklist") return ["Objective", "Checklist items", "Priority", "Owner hints", "Completion criteria"];
  if (outputType === "Email") return ["Subject", "Opening", "Core message", "CTA", "Follow-up angle"];
  if (outputType === "Social Content") return ["Hooks", "Post ideas", "Captions", "Creative notes", "CTAs"];
  if (outputType === "Table") return ["Structured rows", "Comparison fields", "Priority", "Notes"];
  return ["Executive summary", "Findings", "Recommendations", "Risks", "Next actions"];
}

function capabilityList(worker: Worker | undefined, kind: WorkerKind): Array<{ label: string; active: boolean }> {
  return [
    { label: "Memory", active: Boolean(worker?.memoryEnabled) },
    { label: "Website fetch", active: kind === "website" },
    { label: "Competitor parsing", active: kind === "competitor" },
    { label: "Proposal structure", active: kind === "proposal" },
    { label: "Tool-ready execution", active: ["website", "competitor", "proposal", "automation"].includes(kind) },
  ].filter((capability) => capability.active || capability.label === "Memory");
}

export function CommandCenterForm({ workers, memoryCount }: { workers: Worker[]; memoryCount: number }) {
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
  const kind = workerKind(selectedWorker);
  const examples = examplesFor(kind);
  const sections = outputSections(kind, outputType);
  const capabilities = capabilityList(selectedWorker, kind);

  function applyShortcut(shortcut: (typeof WORKFLOW_SHORTCUTS)[number]) {
    const worker = bestWorkerFor(workers, shortcut.kind);
    if (worker) setWorkerId(worker.id);
    setOutputType(shortcut.outputType);
    setRequest(shortcut.prompt);
    setError("");
  }

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
    <form onSubmit={executeMission} className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="surface-panel min-w-0 overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="eyebrow">Mission Request</p>
          <h2 className="mt-1 text-xl font-black text-white">Tell RZG what outcome to produce</h2>
        </div>

        <div className="space-y-5 p-5">
          {memoryCount === 0 && (
            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.07] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">Add business memory to get personalized outputs.</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">Brand voice, services, pricing, target clients, competitors, offer positioning, and SOPs make missions more specific.</p>
                </div>
                <Link href="/dashboard/memory" className="button-secondary shrink-0 px-3 py-2 text-xs">
                  <Brain className="h-4 w-4" />
                  Set up Memory
                </Link>
              </div>
            </div>
          )}

          <div>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Workflow Shortcuts</p>
                <p className="mt-1 text-xs font-semibold text-slate-300">Prefill a proven operating prompt.</p>
              </div>
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {WORKFLOW_SHORTCUTS.map((shortcut) => {
                const Icon = shortcut.icon;
                return (
                  <button
                    key={shortcut.title}
                    type="button"
                    onClick={() => applyShortcut(shortcut)}
                    className="group rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="min-w-0 truncate text-xs font-black text-white group-hover:text-cyan-100">{shortcut.title}</span>
                    </div>
                    <p className="text-[11px] font-semibold leading-4 text-slate-300">{shortcut.outputType}</p>
                  </button>
                );
              })}
            </div>
          </div>

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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="label-premium">Request</label>
              <span className="text-xs font-semibold text-slate-400">{request.length}/10000</span>
            </div>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              required
              rows={12}
              placeholder={placeholderFor(kind)}
              className="input-premium min-h-72 resize-y"
            />
            <p className="helper-text">RZG will create a task behind the scenes, run it immediately, and save the result.</p>
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Example Prompts</p>
              <div className="space-y-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setRequest(example)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs font-semibold leading-5 text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.045] p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">What This Will Produce</p>
              <div className="space-y-2">
                {sections.slice(0, 5).map((section) => (
                  <div key={section} className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-200" />
                    <span className="min-w-0 truncate">{section}</span>
                  </div>
                ))}
              </div>
            </div>
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
              View Mission History
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
            <InfoRow label="Model" value={selectedWorker.model.split("/").pop() ?? selectedWorker.model} />
            <InfoRow label="Memory" value={selectedWorker.memoryEnabled ? "Enabled" : "Disabled"} />
            <InfoRow label="Best Use Case" value={bestUseCase(kind)} />
          </div>
        )}

        <div className="metal-panel p-5">
          <p className="eyebrow">Worker Capabilities</p>
          <div className="mt-4 grid gap-2">
            {capabilities.map((capability) => (
              <div key={capability.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-white">
                  {capability.label === "Memory" ? <Brain className="h-4 w-4 text-cyan-200" /> : <Wrench className="h-4 w-4 text-cyan-200" />}
                  <span className="truncate">{capability.label}</span>
                </span>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${capability.active ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-slate-500/25 bg-slate-500/10 text-slate-400"}`}>
                  {capability.active ? "Ready" : "Off"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <p className="eyebrow">Output Preview</p>
          <div className="mt-4 space-y-2">
            {sections.map((section) => (
              <div key={section} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-slate-200">
                <Target className="h-4 w-4 shrink-0 text-cyan-200" />
                <span className="min-w-0 truncate">{section}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Radio className="h-3.5 w-3.5 text-cyan-200" />
              Creates task, opens console, saves output.
            </div>
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
