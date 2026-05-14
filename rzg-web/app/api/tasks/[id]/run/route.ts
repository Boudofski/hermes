import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { db } from "@/lib/db";
import { tasks, taskRuns, taskLogs, agents, memories } from "@/lib/db/schema";
import { eq, and, or, isNull, desc } from "drizzle-orm";
import { RunTaskSchema } from "@/lib/validations";
import { getAuthenticatedWorkspace, errorResponse } from "@/lib/api-helpers";
import { streamExecution } from "@/lib/hermes-client";

type Params = { params: Promise<{ id: string }> };

const MAX_MEMORY_ENTRIES = 20;
const MAX_MEMORY_CONTENT_CHARS = 1200;
const MAX_MEMORY_BLOCK_CHARS = 12000;
const MAX_HTML_CHARS = 2_000_000;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

type MemoryEntry = {
  key: string;
  content: string;
  agentId: string | null;
};

type WebsiteAuditData = {
  requestedUrl: string;
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  ogTags: Record<string, string>;
  h1: string[];
  h2: string[];
  internalLinksCount: number;
  imagesMissingAlt: number;
  wordCount: number;
};

type CompetitorInsightData = Pick<
  WebsiteAuditData,
  "requestedUrl" | "finalUrl" | "title" | "metaDescription" | "canonical" | "h1" | "h2" | "wordCount"
> & {
  ogTitle: string | null;
  ogDescription: string | null;
  primaryCtas: string[];
  error?: string;
};

function truncateMemoryContent(content: string): string {
  if (content.length <= MAX_MEMORY_CONTENT_CHARS) return content;
  return `${content.slice(0, MAX_MEMORY_CONTENT_CHARS).trimEnd()}...`;
}

function buildMemoryContextBlock(entries: MemoryEntry[], agentId: string): string {
  if (entries.length === 0) return "";

  const lines = ["## Business Memory Context"];
  for (const entry of entries) {
    const scope = entry.agentId === agentId ? "Worker-specific" : "Global";
    lines.push(`\n- Key: ${entry.key}`);
    lines.push(`  Scope: ${scope}`);
    lines.push(`  Value: ${truncateMemoryContent(entry.content)}`);
  }

  const block = lines.join("\n");
  if (block.length <= MAX_MEMORY_BLOCK_CHARS) return block;
  return `${block.slice(0, MAX_MEMORY_BLOCK_CHARS).trimEnd()}\n\n[Memory context truncated for execution budget.]`;
}

function buildExecutionPrompt(memoryBlock: string, auditBlock: string, competitorBlock: string, prompt: string): string {
  if (!memoryBlock && !auditBlock && !competitorBlock) return prompt;
  const sections = [memoryBlock, auditBlock, competitorBlock, `## Worker Task\n${prompt}`].filter(Boolean);
  return sections.join("\n\n");
}

function isWebsiteAuditWorker(agent: { name: string; role: string; goal: string }): boolean {
  const haystack = `${agent.name} ${agent.role} ${agent.goal}`.toLowerCase();
  return haystack.includes("website") && haystack.includes("audit");
}

function isCompetitorIntelligenceWorker(agent: { name: string; role: string; goal: string }): boolean {
  const haystack = `${agent.name} ${agent.role} ${agent.goal}`.toLowerCase();
  return haystack.includes("competitor") && (haystack.includes("intelligence") || haystack.includes("research"));
}

function extractWebsiteUrl(prompt: string): string | null {
  return extractWebsiteUrls(prompt, 1)[0] ?? null;
}

function normalizeUrl(rawUrl: string): string {
  return rawUrl.replace(/[),.;]+$/, "");
}

function extractWebsiteUrls(prompt: string, limit = 5): string[] {
  const urls = new Map<string, string>();
  const explicitMatches = prompt.matchAll(/https?:\/\/[^\s<>"')]+/gi);
  for (const match of explicitMatches) {
    const normalized = normalizeUrl(match[0]);
    urls.set(normalized.toLowerCase(), normalized);
    if (urls.size >= limit) return [...urls.values()];
  }

  const bareMatches = prompt.matchAll(/\b(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+\b(?:\/[^\s<>"')]*)?/gi);
  for (const match of bareMatches) {
    const normalized = `https://${normalizeUrl(match[0])}`;
    urls.set(normalized.toLowerCase(), normalized);
    if (urls.size >= limit) break;
  }

  return [...urls.values()];
}

function isPrivateIp(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    );
  }
  if (version === 6) {
    const lower = address.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:");
  }
  return false;
}

async function validatePublicHttpUrl(rawUrl: string): Promise<URL> {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https URLs can be audited.");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    isPrivateIp(hostname)
  ) {
    throw new Error("Private or local URLs cannot be audited.");
  }

  const records = await lookup(hostname, { all: true });
  if (records.some((record) => isPrivateIp(record.address))) {
    throw new Error("Private or local network targets cannot be audited.");
  }

  return url;
}

async function fetchWebsiteHtml(rawUrl: string, redirects = 0): Promise<{ html: string; finalUrl: string }> {
  const url = await validatePublicHttpUrl(rawUrl);
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "User-Agent": "RZG-AI-Website-Audit/1.0 (+https://rzg.ai)",
    },
  });

  if ([301, 302, 303, 307, 308].includes(res.status)) {
    if (redirects >= MAX_REDIRECTS) throw new Error("Website redirected too many times.");
    const location = res.headers.get("location");
    if (!location) throw new Error("Website redirect did not include a location.");
    return fetchWebsiteHtml(new URL(location, url).toString(), redirects + 1);
  }

  if (!res.ok) throw new Error(`Website returned HTTP ${res.status}.`);

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType && !contentType.toLowerCase().includes("html")) {
    throw new Error(`Expected HTML but received ${contentType}.`);
  }

  const contentLength = Number(res.headers.get("content-length") ?? "0");
  if (contentLength > MAX_HTML_CHARS) {
    throw new Error("Website HTML is too large to audit safely.");
  }

  const html = (await res.text()).slice(0, MAX_HTML_CHARS);
  return { html, finalUrl: url.toString() };
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getAttr(tag: string, attr: string): string | null {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match ? decodeBasicEntities(match[1].trim()) : null;
}

function extractHeadings(html: string, level: 1 | 2): string[] {
  const matches = [...html.matchAll(new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, "gi"))];
  return matches.map((m) => decodeBasicEntities(stripHtml(m[1]))).filter(Boolean).slice(0, 12);
}

function extractWebsiteAudit(html: string, requestedUrl: string, finalUrl: string): WebsiteAuditData {
  const title = decodeBasicEntities(stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")) || null;
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const anchorTags = [...html.matchAll(/<a\b[^>]*>/gi)].map((m) => m[0]);
  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const base = new URL(finalUrl);

  const descriptionTag = metaTags.find((tag) => getAttr(tag, "name")?.toLowerCase() === "description");
  const canonicalTag = linkTags.find((tag) => getAttr(tag, "rel")?.toLowerCase().split(/\s+/).includes("canonical"));
  const ogTags: Record<string, string> = {};

  for (const tag of metaTags) {
    const property = getAttr(tag, "property") ?? getAttr(tag, "name");
    if (property?.toLowerCase().startsWith("og:")) {
      const content = getAttr(tag, "content");
      if (content) ogTags[property] = content;
    }
  }

  let internalLinksCount = 0;
  for (const tag of anchorTags) {
    const href = getAttr(tag, "href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const linkUrl = new URL(href, base);
      if (linkUrl.hostname === base.hostname) internalLinksCount += 1;
    } catch {
      // Ignore malformed href values.
    }
  }

  const imagesMissingAlt = imageTags.filter((tag) => {
    const alt = getAttr(tag, "alt");
    return alt === null || alt.trim() === "";
  }).length;

  const text = stripHtml(html);
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

  return {
    requestedUrl,
    finalUrl,
    title,
    metaDescription: descriptionTag ? getAttr(descriptionTag, "content") : null,
    canonical: canonicalTag ? getAttr(canonicalTag, "href") : null,
    ogTags,
    h1: extractHeadings(html, 1),
    h2: extractHeadings(html, 2),
    internalLinksCount,
    imagesMissingAlt,
    wordCount,
  };
}

function extractPrimaryCtas(html: string): string[] {
  const candidates = [
    ...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi),
    ...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi),
  ];
  const ctaPattern = /\b(get started|start free|book (?:a )?(?:demo|call)|schedule (?:a )?(?:demo|call)|contact sales|contact us|request (?:a )?demo|try (?:it )?free|sign up|join now|buy now|learn more|see pricing|view pricing|talk to sales|subscribe|download)\b/i;
  const seen = new Set<string>();
  const phrases: string[] = [];

  for (const candidate of candidates) {
    const text = decodeBasicEntities(stripHtml(candidate[1])).replace(/\s+/g, " ").trim();
    if (!text || text.length > 80 || !ctaPattern.test(text)) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    phrases.push(text);
    if (phrases.length >= 8) break;
  }

  return phrases;
}

function extractCompetitorInsight(html: string, requestedUrl: string, finalUrl: string): CompetitorInsightData {
  const audit = extractWebsiteAudit(html, requestedUrl, finalUrl);
  return {
    requestedUrl: audit.requestedUrl,
    finalUrl: audit.finalUrl,
    title: audit.title,
    metaDescription: audit.metaDescription,
    canonical: audit.canonical,
    h1: audit.h1,
    h2: audit.h2,
    wordCount: audit.wordCount,
    ogTitle: audit.ogTags["og:title"] ?? null,
    ogDescription: audit.ogTags["og:description"] ?? null,
    primaryCtas: extractPrimaryCtas(html),
  };
}

function buildWebsiteAuditContext(audit: WebsiteAuditData): string {
  const ogSummary = Object.entries(audit.ogTags)
    .map(([key, value]) => `  - ${key}: ${value}`)
    .join("\n") || "  - None found";

  return `## Website Audit Findings
Source URL: ${audit.requestedUrl}
Fetched URL: ${audit.finalUrl}

### SEO Structure
- Title: ${audit.title ?? "Missing"}
- Meta description: ${audit.metaDescription ?? "Missing"}
- Canonical: ${audit.canonical ?? "Missing"}
- Word count estimate: ${audit.wordCount}
- Internal links found: ${audit.internalLinksCount}
- Images missing alt text: ${audit.imagesMissingAlt}

### H1 Headings
${audit.h1.length ? audit.h1.map((h) => `- ${h}`).join("\n") : "- None found"}

### H2 Headings
${audit.h2.length ? audit.h2.map((h) => `- ${h}`).join("\n") : "- None found"}

### Open Graph Tags
${ogSummary}

Use these fetched website findings to generate a professional, prioritized website audit. Include conversion, SEO, accessibility, content, and trust-signal recommendations. Be specific and actionable.`;
}

function buildCompetitorIntelligenceContext(competitors: CompetitorInsightData[]): string {
  const rows = competitors.map((competitor, index) => {
    if (competitor.error) {
      return `### Competitor ${index + 1}: ${competitor.requestedUrl}
- Fetch status: Unavailable
- Error: ${competitor.error}`;
    }

    return `### Competitor ${index + 1}: ${competitor.finalUrl}
- Requested URL: ${competitor.requestedUrl}
- Title: ${competitor.title ?? "Missing"}
- Meta description: ${competitor.metaDescription ?? "Missing"}
- Canonical: ${competitor.canonical ?? "Missing"}
- OG title: ${competitor.ogTitle ?? "Missing"}
- OG description: ${competitor.ogDescription ?? "Missing"}
- Word count estimate: ${competitor.wordCount}
- H1 headings: ${competitor.h1.length ? competitor.h1.join(" | ") : "None found"}
- H2 headings: ${competitor.h2.length ? competitor.h2.slice(0, 8).join(" | ") : "None found"}
- Primary CTA phrases: ${competitor.primaryCtas.length ? competitor.primaryCtas.join(" | ") : "None detected"}`;
  });

  return `## Competitor Intelligence Context
RZG fetched and parsed the competitor websites below before generation. Use this evidence as the basis for the strategy.

${rows.join("\n\n")}

Produce a professional competitor intelligence report with:
- Competitor matrix
- Positioning gaps
- Offer opportunities
- Differentiation strategy
- Recommended next actions

Ground conclusions in the fetched positioning signals. If a competitor could not be fetched, note that limitation without inventing facts.`;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await getAuthenticatedWorkspace();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const parsed = RunTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Load task + agent
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.workspaceId, auth.workspace.id)));
  if (!task) return errorResponse("Task not found", 404);

  const [agent] = await db.select().from(agents).where(eq(agents.id, task.agentId));
  if (!agent) return errorResponse("Agent not found", 404);

  const prompt = parsed.data.overridePrompt || task.prompt;
  const isCompetitorWorker = isCompetitorIntelligenceWorker(agent);
  const websiteUrl = !isCompetitorWorker && isWebsiteAuditWorker(agent) ? extractWebsiteUrl(prompt) : null;
  const competitorUrls = isCompetitorWorker ? extractWebsiteUrls(prompt, 5) : [];

  let memoryContext = "";
  let memoryCount = 0;

  // Memory is only injected for workers that explicitly opt into memory.
  // This keeps non-memory workers deterministic and avoids silently expanding
  // prompts for tasks where the user disabled persistent context.
  if (agent.memoryEnabled) {
    const memoryEntries = await db
      .select({
        key: memories.key,
        content: memories.content,
        agentId: memories.agentId,
        updatedAt: memories.updatedAt,
      })
      .from(memories)
      .where(
        and(
          eq(memories.workspaceId, auth.workspace.id),
          or(isNull(memories.agentId), eq(memories.agentId, agent.id))
        )
      )
      .orderBy(desc(memories.updatedAt))
      .limit(MAX_MEMORY_ENTRIES);

    memoryCount = memoryEntries.length;
    memoryContext = buildMemoryContextBlock(memoryEntries, agent.id);
  }

  // Create task run record
  const [run] = await db
    .insert(taskRuns)
    .values({
      taskId: task.id,
      status: "running",
      startedAt: new Date(),
      inputPrompt: prompt,
      modelUsed: agent.model,
    })
    .returning();

  // Update task status
  await db.update(tasks).set({ status: "running", lastRunAt: new Date() }).where(eq(tasks.id, id));

  // Stream SSE from hermes-adapter to client, persisting log lines to DB
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const emitEvent = async (event: {
          type: string;
          content: string;
          tool_name?: string | null;
          metadata?: Record<string, unknown> | null;
        }) => {
          const raw = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${raw}\n\n`));
          await db.insert(taskLogs).values({
            taskRunId: run.id,
            eventType: event.type,
            content: event.content,
            toolName: event.tool_name ?? null,
            metadata: event.metadata ?? null,
          });
        };

        if (memoryCount > 0) {
          await emitEvent({
            type: "memory_loaded",
            content: `Loaded ${memoryCount} memory ${memoryCount === 1 ? "entry" : "entries"} for this run.`,
            metadata: { count: memoryCount },
          });
        }

        let auditContext = "";
        if (websiteUrl) {
          let activeAuditTool: string | null = null;
          try {
            activeAuditTool = "website_fetch";
            await emitEvent({
              type: "tool_start",
              tool_name: "website_fetch",
              content: `Fetching website: ${websiteUrl}`,
            });
            const { html, finalUrl } = await fetchWebsiteHtml(websiteUrl);
            await emitEvent({
              type: "tool_end",
              tool_name: "website_fetch",
              content: `Fetched website HTML from ${finalUrl}`,
              metadata: { url: websiteUrl, finalUrl },
            });
            activeAuditTool = null;

            activeAuditTool = "seo_parse";
            await emitEvent({
              type: "tool_start",
              tool_name: "seo_parse",
              content: "Parsing SEO structure",
            });
            const audit = extractWebsiteAudit(html, websiteUrl, finalUrl);
            await emitEvent({
              type: "tool_end",
              tool_name: "seo_parse",
              content: `Parsed SEO structure: ${audit.h1.length} H1, ${audit.h2.length} H2, ${audit.imagesMissingAlt} images missing alt text.`,
              metadata: {
                h1Count: audit.h1.length,
                h2Count: audit.h2.length,
                internalLinksCount: audit.internalLinksCount,
                imagesMissingAlt: audit.imagesMissingAlt,
                wordCount: audit.wordCount,
              },
            });
            activeAuditTool = null;

            activeAuditTool = "audit_build";
            await emitEvent({
              type: "tool_start",
              tool_name: "audit_build",
              content: "Building audit",
            });
            auditContext = buildWebsiteAuditContext(audit);
            await emitEvent({
              type: "tool_end",
              tool_name: "audit_build",
              content: "Built structured website audit context",
            });
            activeAuditTool = null;
          } catch (auditErr) {
            const msg = auditErr instanceof Error ? auditErr.message : "Unknown website audit error";
            await emitEvent({
              type: "tool_end",
              tool_name: activeAuditTool ?? "website_fetch",
              content: `Website audit preflight skipped: ${msg}`,
              metadata: { error: msg, url: websiteUrl },
            });
          }
        }

        let competitorContext = "";
        if (isCompetitorWorker) {
          const competitors: CompetitorInsightData[] = [];
          let activeCompetitorTool: string | null = null;

          try {
            activeCompetitorTool = "competitor_detect";
            await emitEvent({
              type: "tool_start",
              tool_name: "competitor_detect",
              content: "Detecting competitors",
            });
            await emitEvent({
              type: "tool_end",
              tool_name: "competitor_detect",
              content: `Detected ${competitorUrls.length} competitor ${competitorUrls.length === 1 ? "URL" : "URLs"}.`,
              metadata: { count: competitorUrls.length, urls: competitorUrls },
            });
            activeCompetitorTool = null;

            if (competitorUrls.length > 0) {
              activeCompetitorTool = "competitor_fetch";
              await emitEvent({
                type: "tool_start",
                tool_name: "competitor_fetch",
                content: "Fetching competitor sites",
              });

              const fetchedSites: Array<{ requestedUrl: string; html: string; finalUrl: string } | { requestedUrl: string; error: string }> = [];
              for (const url of competitorUrls) {
                try {
                  const { html, finalUrl } = await fetchWebsiteHtml(url);
                  fetchedSites.push({ requestedUrl: url, html, finalUrl });
                } catch (fetchErr) {
                  fetchedSites.push({
                    requestedUrl: url,
                    error: fetchErr instanceof Error ? fetchErr.message : "Unknown fetch error",
                  });
                }
              }

              const successfulFetches = fetchedSites.filter((site) => "html" in site).length;
              await emitEvent({
                type: "tool_end",
                tool_name: "competitor_fetch",
                content: `Fetched ${successfulFetches} of ${competitorUrls.length} competitor sites.`,
                metadata: { requested: competitorUrls.length, fetched: successfulFetches },
              });
              activeCompetitorTool = null;

              activeCompetitorTool = "positioning_parse";
              await emitEvent({
                type: "tool_start",
                tool_name: "positioning_parse",
                content: "Parsing positioning",
              });

              for (const site of fetchedSites) {
                if ("error" in site) {
                  competitors.push({
                    requestedUrl: site.requestedUrl,
                    finalUrl: site.requestedUrl,
                    title: null,
                    metaDescription: null,
                    canonical: null,
                    h1: [],
                    h2: [],
                    wordCount: 0,
                    ogTitle: null,
                    ogDescription: null,
                    primaryCtas: [],
                    error: site.error,
                  });
                  continue;
                }
                competitors.push(extractCompetitorInsight(site.html, site.requestedUrl, site.finalUrl));
              }

              await emitEvent({
                type: "tool_end",
                tool_name: "positioning_parse",
                content: `Parsed positioning signals for ${competitors.filter((c) => !c.error).length} competitors.`,
                metadata: {
                  parsed: competitors.filter((c) => !c.error).length,
                  failed: competitors.filter((c) => c.error).length,
                },
              });
              activeCompetitorTool = null;
            }

            activeCompetitorTool = "comparison_matrix";
            await emitEvent({
              type: "tool_start",
              tool_name: "comparison_matrix",
              content: "Building comparison matrix",
            });
            competitorContext = competitors.length > 0
              ? buildCompetitorIntelligenceContext(competitors)
              : `## Competitor Intelligence Context
No valid competitor URLs were detected in the task prompt. Ask the user for 2-5 public competitor URLs before making evidence-based claims.`;
            await emitEvent({
              type: "tool_end",
              tool_name: "comparison_matrix",
              content: competitors.length > 0
                ? `Built comparison context for ${competitors.length} competitors.`
                : "No competitor comparison context could be built.",
              metadata: { count: competitors.length },
            });
            activeCompetitorTool = null;
          } catch (competitorErr) {
            const msg = competitorErr instanceof Error ? competitorErr.message : "Unknown competitor intelligence error";
            await emitEvent({
              type: "tool_end",
              tool_name: activeCompetitorTool ?? "competitor_detect",
              content: `Competitor intelligence preflight skipped: ${msg}`,
              metadata: { error: msg },
            });
          }
        }

        const executionPrompt = buildExecutionPrompt(memoryContext, auditContext, competitorContext, prompt);

        if (websiteUrl) {
          await emitEvent({
            type: "tool_start",
            tool_name: "recommendation_generation",
            content: "Generating recommendations",
          });
        }
        if (isCompetitorWorker) {
          await emitEvent({
            type: "tool_start",
            tool_name: "strategy_generation",
            content: "Generating strategy",
          });
        }

        const adapterRes = await streamExecution({
          task_run_id: run.id,
          message: executionPrompt,
          agent_config: {
            name: agent.name,
            role: agent.role,
            goal: agent.goal,
            instructions: agent.instructions ?? undefined,
            enabled_toolsets: agent.enabledToolsets ?? [],
            disabled_toolsets: agent.disabledToolsets ?? [],
            memory_enabled: agent.memoryEnabled,
          },
          model: agent.model,
          api_key: parsed.data.apiKey,
          max_iterations: agent.maxIterations,
        });

        if (!adapterRes.body) throw new Error("No response body from adapter");

        const reader = adapterRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalResponse = "";
        let hasError = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const chunk of lines) {
            const dataLine = chunk.trim();
            if (!dataLine.startsWith("data:")) continue;

            const raw = dataLine.slice(5).trim();
            if (raw === "[DONE]") continue;

            // Forward to client
            controller.enqueue(encoder.encode(`data: ${raw}\n\n`));

            // Persist to DB
            try {
              const event = JSON.parse(raw);
              await db.insert(taskLogs).values({
                taskRunId: run.id,
                eventType: event.type,
                content: event.content,
                toolName: event.tool_name ?? null,
                metadata: event.metadata ?? null,
              });

              if (event.type === "done") finalResponse = event.content;
              if (event.type === "error") hasError = true;
            } catch {
              // Malformed JSON from adapter — skip persisting, still forward
            }
          }
        }

        if (websiteUrl) {
          await emitEvent({
            type: "tool_end",
            tool_name: "recommendation_generation",
            content: "Generated website audit recommendations",
          });
        }
        if (isCompetitorWorker) {
          await emitEvent({
            type: "tool_end",
            tool_name: "strategy_generation",
            content: "Generated competitor intelligence strategy",
          });
        }

        // Finalize task run
        const finalStatus = hasError ? "failed" : "completed";
        await db
          .update(taskRuns)
          .set({
            status: finalStatus,
            completedAt: new Date(),
            finalResponse: finalResponse || null,
          })
          .where(eq(taskRuns.id, run.id));

        await db
          .update(tasks)
          .set({ status: finalStatus })
          .where(eq(tasks.id, id));

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";

        await db.update(taskRuns).set({ status: "failed", errorMessage: msg, completedAt: new Date() }).where(eq(taskRuns.id, run.id));
        await db.update(tasks).set({ status: "failed" }).where(eq(tasks.id, id));

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", content: msg })}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      "X-Run-Id": run.id,
    },
  });
}
