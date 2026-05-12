/**
 * Server-side client for the hermes-adapter FastAPI service.
 * Never imported in client components — only used in API route handlers.
 */

const ADAPTER_URL = process.env.RZG_ADAPTER_URL ?? "http://localhost:8001";
const ADAPTER_SECRET = process.env.RZG_ADAPTER_SECRET ?? "";

export interface AgentConfigPayload {
  name: string;
  role: string;
  goal: string;
  instructions?: string;
  enabled_toolsets?: string[];
  disabled_toolsets?: string[];
  memory_enabled: boolean;
}

export interface ExecutePayload {
  task_run_id: string;
  message: string;
  agent_config: AgentConfigPayload;
  model: string;
  api_key?: string;
  base_url?: string;
  max_iterations: number;
}

function headers() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (ADAPTER_SECRET) h["Authorization"] = `Bearer ${ADAPTER_SECRET}`;
  return h;
}

/** Check adapter is reachable. */
export async function checkAdapterHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${ADAPTER_URL}/health`, {
      headers: headers(),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Stream an agent execution from the adapter.
 * Returns a ReadableStream of SSE lines that the Next.js route can pipe
 * directly to the client.
 */
export async function streamExecution(payload: ExecutePayload): Promise<Response> {
  const res = await fetch(`${ADAPTER_URL}/execute`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
    // Node 18+: disable body compression so SSE chunks flush immediately
    // @ts-expect-error duplex is valid in Node fetch
    duplex: "half",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Adapter error ${res.status}: ${text}`);
  }

  return res;
}
