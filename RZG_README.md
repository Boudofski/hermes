# RZG AI — Development & Deployment Guide

> Autonomous AI Workers for Modern Businesses  
> Domain: rzg.ai | Stack: Next.js 15 + FastAPI + Supabase + Hermes Agent

---

## Architecture

```
Browser
  │
  ▼
rzg-web (Next.js 15, port 3000)
  │  Auth: Supabase Auth
  │  DB:   Drizzle ORM → Supabase Postgres
  │
  ▼  HTTP + SSE
hermes-adapter (FastAPI, port 8001)
  │  Wraps AIAgent from run_agent.py
  │  Streams tool events + text deltas over SSE
  │
  ▼
AIAgent (NousResearch Hermes Agent)
  │  Any OpenAI-compatible provider
  └─ OpenRouter / Groq / Gemini / OpenAI
```

---

## Local Development (Quick Start)

### Prerequisites

- Python 3.11+ and `uv` (for the adapter)
- Node.js 20+ and npm (for the web app)
- A Supabase project (free tier works)
- An LLM API key (OpenRouter recommended — 200+ models)

### 1. Set up the Hermes adapter

```bash
# Install Hermes and its dependencies (from repo root)
uv venv .venv --python 3.11 && source .venv/bin/activate
uv pip install -e ".[all]"

# Configure the adapter
cp hermes-adapter/.env.example hermes-adapter/.env
# Edit hermes-adapter/.env:
#   MOCK_MODE=false          # set true to skip real LLM calls during dev
#   DEFAULT_API_KEY=sk-...   # your OpenRouter or OpenAI key
#   ADAPTER_SECRET=...       # pick any secret string

# Start the adapter (start.sh handles venv activation, .env loading, and PYTHONPATH)
bash hermes-adapter/start.sh
```

Verify: `curl http://localhost:8001/health`

### 2. Set up the database

1. Create a Supabase project at https://supabase.com
2. Open **SQL Editor** and run the full contents of:
   `rzg-web/lib/db/migrations/0000_init.sql`
3. Enable **Google OAuth** in Supabase → Authentication → Providers (optional)

### 3. Set up the Next.js app

```bash
cd rzg-web
cp .env.example .env.local

# Fill in .env.local:
#   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   SUPABASE_SERVICE_ROLE_KEY=...
#   DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
#   RZG_ADAPTER_URL=http://localhost:8001
#   RZG_ADAPTER_SECRET=...    # must match ADAPTER_SECRET in hermes-adapter/.env

npm install
npm run dev
```

Open http://localhost:3000 → Register → Dashboard.

---

## Running in Mock Mode (no LLM key needed)

Set `MOCK_MODE=true` in `hermes-adapter/.env`. The adapter returns synthetic responses without calling any AI provider. Useful for UI development and CI.

---

## Environment Variables Reference

### `hermes-adapter/.env`

| Variable | Required | Description |
|---|---|---|
| `ADAPTER_SECRET` | Yes (prod) | Shared secret — Next.js sends as Bearer token |
| `MOCK_MODE` | No | `true` → return mock responses |
| `DEFAULT_API_KEY` | Yes (non-mock) | Fallback LLM provider API key |
| `DEFAULT_BASE_URL` | No | Provider base URL (default: OpenRouter) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `PORT` | No | Port (default: 8001) |

### `rzg-web/.env.local`

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-only) |
| `DATABASE_URL` | Yes | Postgres connection string (direct) |
| `RZG_ADAPTER_URL` | Yes | URL of hermes-adapter service |
| `RZG_ADAPTER_SECRET` | Yes (prod) | Must match adapter `ADAPTER_SECRET` |
| `NEXT_PUBLIC_APP_URL` | No | Public URL (default: http://localhost:3000) |

---

## Docker Deployment

```bash
# Copy and fill env files first
cp hermes-adapter/.env.example hermes-adapter/.env
cp rzg-web/.env.example rzg-web/.env.local
# Edit both files with your real values

# Build and start RZG services
docker compose --profile rzg up -d --build

# Check logs
docker compose logs -f rzg-hermes-adapter
docker compose logs -f rzg-web
```

---

## Deploying to rzg.ai (Production)

### Option A: Vercel (Next.js) + VPS (adapter)

1. **Hermes adapter on VPS:**
   ```bash
   # On your VPS (Ubuntu 22.04+)
   git clone https://github.com/NousResearch/hermes-agent.git
   cd hermes-agent
   python3.11 -m pip install uv
   uv venv .venv --python 3.11
   source .venv/bin/activate
   uv pip install -e ".[all]"
   pip install -r hermes-adapter/requirements.txt
   cp hermes-adapter/.env.example hermes-adapter/.env
   # Edit .env then:
   cd hermes-adapter
   MOCK_MODE=false PYTHONPATH=.. uvicorn main:app --host 0.0.0.0 --port 8001
   # Use systemd or pm2 to keep it running
   ```

2. **Next.js on Vercel:**
   - Connect `rzg-web/` subdirectory to Vercel
   - Set all env vars from `rzg-web/.env.example` in Vercel project settings
   - Set `RZG_ADAPTER_URL` to your VPS URL (e.g. `https://api.rzg.ai`)
   - Deploy

3. **Reverse proxy (nginx) for adapter:**
   ```nginx
   server {
     listen 443 ssl;
     server_name api.rzg.ai;
     location / {
       proxy_pass http://localhost:8001;
       proxy_set_header Connection '';
       proxy_http_version 1.1;
       chunked_transfer_encoding on;
     }
   }
   ```

### Option B: Railway (full stack)

1. Deploy `hermes-adapter/` as a Python service on Railway
2. Deploy `rzg-web/` as a Node.js service on Railway  
3. Set `RZG_ADAPTER_URL` to the Railway internal URL of the adapter

---

## What Was Built (Phase 1 + Phase 2)

### `hermes-adapter/` — FastAPI Adapter Service
- `main.py` — FastAPI app with `/health` and `/execute` endpoints
- `agent_runner.py` — wraps `AIAgent` with non-blocking SSE streaming, mock mode, 10-min timeout
- `models.py` — Pydantic request/response models (includes `memory_context` injection)
- `start.sh` — startup script: auto-activates venv, loads `.env`, sets PYTHONPATH
- Bearer token auth (`ADAPTER_SECRET`), CORS middleware

### `rzg-web/` — Next.js 15 Dashboard
- **Auth:** Supabase SSR auth with email/password + Google OAuth
- **Middleware:** Route protection (unauthenticated → /login)
- **DB:** Drizzle ORM schema with RLS on all tables
- **Pages:** Landing, Login, Register, Dashboard, AI Workers, Tasks, Memory
- **API routes:** CRUD for agents, tasks; SSE streaming runner; Memory CRUD (GET/POST/PATCH/DELETE)
- **Components:** Sidebar, TaskRunner with run history + retry, NewTaskButton modal, MemoryManager

### AI Worker Templates (`lib/agent-templates.ts`)
8 pre-built templates with detailed system prompts, each with tailored model/toolset/iteration settings:
Research Agent, Content Agent, SEO Agent, Competitor Analysis, Marketing Agent, Social Media, Proposal Writer, Business Automation

### Database Schema (Supabase + Drizzle)
Tables: `workspaces`, `agents`, `tasks`, `task_runs`, `task_logs`, `memories`, `provider_keys`, `usage_logs`  
Row-Level Security: all tables scoped to workspace owner  
Auto-creates workspace on user signup (DB trigger)

---

## Known Limitations & Phase 3 TODOs

| Item | Status | Notes |
|---|---|---|
| Supabase Google OAuth | Manual setup | Enable in Supabase dashboard → Auth → Providers |
| LLM API key per workspace | Not yet | Currently uses adapter's `DEFAULT_API_KEY`; wire `provider_keys` table into `/run/route.ts` |
| Memory ↔ Hermes file sync | Partial | Web UI CRUD works against DB; Hermes `~/.hermes/memories/` files not yet synced |
| Task scheduling (cron) | Schema ready | `schedule_expression` column exists; cron runner not wired |
| Usage/cost tracking | Schema ready | `usage_logs` table exists; token counts from Hermes not yet captured |
| ADAPTER_SECRET enforcement | Dev warn only | In prod: always set both `ADAPTER_SECRET` and `RZG_ADAPTER_SECRET` |
| Landing page | Placeholder | `app/page.tsx` is minimal; build full marketing page for rzg.ai |
| Billing | Not started | Stripe + usage caps per plan |

---

## Phase 3 Next Steps (Priority Order)

1. **Test real Hermes execution** — `MOCK_MODE=false` + real OpenRouter key, verify SSE + logs
2. **Agent-specific API keys** — read encrypted key from `provider_keys` table, pass to adapter
3. **Memory ↔ Hermes sync** — add `GET /memory` + `POST /memory` to `hermes-adapter/main.py` reading `~/.hermes/memories/`
4. **Task scheduler** — use `node-cron` or a Supabase Edge Function cron job to fire `/run` on schedule
5. **Landing page** — build full marketing page at `app/page.tsx`
6. **Billing** — Stripe, plan enforcement, usage caps
