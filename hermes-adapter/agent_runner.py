"""
Wraps AIAgent to produce async SSE event streams.

Mock mode: set MOCK_MODE=true in env to return synthetic responses
without importing or running the real Hermes AIAgent.
"""

import asyncio
import json
import logging
import os
import queue
import sys
import threading
import time
import traceback
from typing import AsyncGenerator, Optional

from models import AgentConfig, LogEvent

logger = logging.getLogger(__name__)

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() in ("true", "1", "yes")
DEFAULT_MAX_TOKENS = 3000

# Add hermes root to sys.path so run_agent.py is importable.
_HERMES_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _HERMES_ROOT not in sys.path:
    sys.path.insert(0, _HERMES_ROOT)

# Validate AIAgent is importable at startup (warn only — mock mode still works)
_HERMES_AVAILABLE = False
if not MOCK_MODE:
    try:
        from run_agent import AIAgent as _AIAgent  # noqa: F401
        _HERMES_AVAILABLE = True
        logger.info("Hermes AIAgent: importable OK")
    except ImportError as _err:
        logger.warning(
            "Hermes AIAgent not importable (%s). "
            "Install Hermes deps or set MOCK_MODE=true. "
            "Task runs will fail until resolved.",
            _err,
        )


def _default_max_tokens() -> int:
    raw = os.getenv("DEFAULT_MAX_TOKENS", str(DEFAULT_MAX_TOKENS)).strip()
    try:
        value = int(raw)
        if value <= 0:
            raise ValueError
        return value
    except ValueError:
        logger.warning(
            "Invalid DEFAULT_MAX_TOKENS=%r; falling back to %s",
            raw,
            DEFAULT_MAX_TOKENS,
        )
        return DEFAULT_MAX_TOKENS


def _build_system_prompt(config: AgentConfig) -> str:
    parts = [
        f"You are {config.name}, an AI worker.",
        f"Role: {config.role}",
        f"Goal: {config.goal}",
    ]
    if config.instructions:
        parts.append(f"\nInstructions:\n{config.instructions}")
    if config.memory_context:
        parts.append(f"\nRelevant Memory:\n{config.memory_context}")
    parts.append("\nBe direct, precise, and produce actionable output.")
    return "\n".join(parts)


def _run_mock(message: str, config: AgentConfig, event_queue: "queue.Queue[Optional[LogEvent]]") -> None:
    """Emit synthetic events without running a real agent."""
    events = [
        LogEvent(type="log", content=f"[MOCK] Starting agent: {config.name}"),
        LogEvent(type="tool_start", content="web_search", tool_name="web_search"),
        LogEvent(type="log", content="[MOCK] Searching the web…"),
        LogEvent(type="tool_end", content="web_search complete", tool_name="web_search"),
        LogEvent(type="log", content="[MOCK] Composing response…"),
        LogEvent(
            type="text_delta",
            content=(
                f"**[MOCK RESPONSE]**\n\n"
                f"Task received: {message}\n\n"
                f"Agent **{config.name}** ({config.role}) would execute this using "
                f"real Hermes AI.\n\n"
                f"To enable real AI execution:\n"
                f"1. Ensure Hermes deps are installed: `uv pip install -e \".[all]\"`\n"
                f"2. Set `MOCK_MODE=false` in `hermes-adapter/.env`\n"
                f"3. Set `DEFAULT_API_KEY` to an OpenRouter or OpenAI-compatible key"
            ),
        ),
        LogEvent(type="done", content="[MOCK] Task completed successfully."),
    ]
    for ev in events:
        time.sleep(0.25)
        event_queue.put(ev)
    event_queue.put(None)


def _run_real_agent(
    message: str,
    config: AgentConfig,
    model: str,
    api_key: Optional[str],
    base_url: Optional[str],
    max_iterations: int,
    event_queue: "queue.Queue[Optional[LogEvent]]",
) -> None:
    """Run the real AIAgent in a background thread, pushing events to the queue."""
    try:
        from run_agent import AIAgent  # lazy import — only needed in real mode

        def on_tool_progress(event_type: str, tool_name: str, preview: str, args: dict):
            ev = LogEvent(
                type="tool_start" if event_type == "tool.started" else "tool_end",
                content=preview or tool_name,
                tool_name=tool_name,
                metadata={"args_preview": str(args)[:200]},
            )
            event_queue.put(ev)

        def on_stream(delta: str):
            event_queue.put(LogEvent(type="text_delta", content=delta))

        system_prompt = _build_system_prompt(config)
        enabled = config.enabled_toolsets or []
        disabled = config.disabled_toolsets or []

        agent = AIAgent(
            api_key=api_key or os.getenv("DEFAULT_API_KEY", ""),
            base_url=base_url or os.getenv("DEFAULT_BASE_URL", "https://openrouter.ai/api/v1"),
            model=model,
            max_tokens=_default_max_tokens(),
            max_iterations=max_iterations,
            enabled_toolsets=enabled if enabled else None,
            disabled_toolsets=disabled if disabled else None,
            quiet_mode=True,
            tool_progress_callback=on_tool_progress,
            skip_memory=not config.memory_enabled,
            skip_context_files=True,
            ephemeral_system_prompt=system_prompt,
        )

        event_queue.put(LogEvent(type="log", content=f"Agent {config.name} initialised — running…"))

        result = agent.run_conversation(
            user_message=message,
            stream_callback=on_stream,
        )

        final = result.get("final_response", "")
        event_queue.put(LogEvent(type="done", content=final))

    except ImportError as exc:
        msg = (
            f"Hermes not installed: {exc}. "
            "Install with: uv pip install -e \".[all]\" from the repo root, "
            "or set MOCK_MODE=true."
        )
        logger.error(msg)
        event_queue.put(LogEvent(type="error", content=msg))
    except Exception as exc:
        tb = traceback.format_exc()
        logger.error("Agent run failed: %s\n%s", exc, tb)
        event_queue.put(LogEvent(type="error", content=str(exc), metadata={"traceback": tb[:2000]}))
    finally:
        event_queue.put(None)


async def run_agent_stream(
    message: str,
    config: AgentConfig,
    model: str,
    api_key: Optional[str],
    base_url: Optional[str],
    max_iterations: int,
) -> AsyncGenerator[str, None]:
    """
    Async generator yielding SSE-formatted strings.
      `data: <json>\\n\\n`  — one per event
      `data: [DONE]\\n\\n`  — terminal frame
    """
    event_queue: "queue.Queue[Optional[LogEvent]]" = queue.Queue()
    loop = asyncio.get_event_loop()

    def _worker():
        if MOCK_MODE:
            _run_mock(message, config, event_queue)
        else:
            _run_real_agent(message, config, model, api_key, base_url, max_iterations, event_queue)

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()

    POLL_INTERVAL = 0.05   # 50ms poll — keeps event loop free
    TIMEOUT_SECS = 600     # 10-minute hard cap per task

    deadline = loop.time() + TIMEOUT_SECS

    while True:
        if loop.time() > deadline:
            yield f"data: {json.dumps({'type': 'error', 'content': 'Agent exceeded 10-minute timeout'})}\n\n"
            yield "data: [DONE]\n\n"
            break

        try:
            # Non-blocking get with tiny sleep to yield the event loop
            event: Optional[LogEvent] = event_queue.get_nowait()
        except queue.Empty:
            await asyncio.sleep(POLL_INTERVAL)
            continue

        if event is None:
            yield "data: [DONE]\n\n"
            break

        yield f"data: {event.model_dump_json()}\n\n"
