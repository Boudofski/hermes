"""
Hermes Adapter Service — FastAPI HTTP layer over AIAgent.

Environment variables:
  ADAPTER_SECRET    Shared secret the Next.js app sends as Bearer token
  MOCK_MODE         Set to "true" to return mock responses (dev/testing)
  DEFAULT_API_KEY   Fallback LLM API key if request doesn't supply one
  DEFAULT_BASE_URL  Fallback provider base URL
  PORT              Port to listen on (default 8001)
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from agent_runner import run_agent_stream, MOCK_MODE
from models import ExecuteRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ADAPTER_SECRET = os.getenv("ADAPTER_SECRET", "")
_security = HTTPBearer(auto_error=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    mode = "MOCK" if MOCK_MODE else "REAL"
    logger.info("Hermes Adapter starting — mode=%s", mode)
    yield
    logger.info("Hermes Adapter shutting down")


app = FastAPI(title="Hermes Adapter", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _verify_secret(credentials: HTTPAuthorizationCredentials = Depends(_security)):
    """Reject requests that don't carry the shared adapter secret."""
    if not ADAPTER_SECRET:
        # Secret not configured — open in dev mode (log a warning once)
        return
    if not credentials or credentials.credentials != ADAPTER_SECRET:
        raise HTTPException(status_code=401, detail="Invalid adapter secret")


@app.get("/health")
async def health():
    return {"status": "ok", "mock_mode": MOCK_MODE}


@app.post("/execute")
async def execute(
    req: ExecuteRequest,
    _: None = Depends(_verify_secret),
):
    """
    Stream an agent execution as Server-Sent Events.

    The client (Next.js route handler) opens this as an SSE stream and
    relays events to the browser, writing log lines to the DB along the way.
    """
    logger.info(
        "execute task_run_id=%s agent=%s model=%s mock=%s",
        req.task_run_id,
        req.agent_config.name,
        req.model,
        MOCK_MODE,
    )

    stream = run_agent_stream(
        message=req.message,
        config=req.agent_config,
        model=req.model,
        api_key=req.api_key,
        base_url=req.base_url,
        max_iterations=req.max_iterations,
    )

    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "X-Task-Run-Id": req.task_run_id,
        },
    )
