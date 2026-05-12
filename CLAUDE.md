# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Setup

```bash
# Clone and install
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
uv venv .venv --python 3.11
source .venv/bin/activate
uv pip install -e ".[all,dev]"

# Or use the convenience script (installs uv, venv, deps, symlinks ~/.local/bin/hermes)
./setup-hermes.sh
```

## Commands

```bash
# Run tests (ALWAYS use this — matches CI hermetically)
scripts/run_tests.sh
scripts/run_tests.sh tests/gateway/              # one directory
scripts/run_tests.sh tests/agent/test_foo.py::test_x  # one test
scripts/run_tests.sh -v --tb=long               # extra pytest flags

# Lint
ruff check .          # only PLW1514 (unspecified-encoding) is enforced

# Type check
ty check              # configured in pyproject.toml [tool.ty]

# TUI development
cd ui-tui && npm install
npm run dev           # watch mode
npm run type-check    # tsc --noEmit
npm run lint          # eslint
npm test              # vitest

# Run Hermes
hermes                # interactive CLI
hermes --tui          # Ink-based TUI
hermes doctor         # diagnose issues
```

**Do not call `pytest` directly.** The wrapper enforces hermetic parity with CI: unsets all `*_API_KEY`/`*_TOKEN` vars, redirects `HERMES_HOME` to a temp dir, sets `TZ=UTC LANG=C.UTF-8`, and limits to `-n 4` workers.

## Architecture

### File Dependency Chain

```
tools/registry.py  (no deps — base for all tool files)
       ↑
tools/*.py         (each calls registry.register() at import time)
       ↑
model_tools.py     (imports registry, triggers auto-discovery)
       ↑
run_agent.py, cli.py, batch_runner.py, environments/
```

### Core Entry Points

| File | Role |
|------|------|
| `run_agent.py` | `AIAgent` class — core conversation loop (~12k LOC) |
| `cli.py` | `HermesCLI` class — interactive CLI with prompt_toolkit (~11k LOC) |
| `model_tools.py` | Tool orchestration, `discover_builtin_tools()`, `handle_function_call()` |
| `toolsets.py` | All toolset definitions; `_HERMES_CORE_TOOLS` is the default bundle |
| `hermes_state.py` | `SessionDB` — SQLite session store with FTS5 search |
| `hermes_constants.py` | `get_hermes_home()`, `display_hermes_home()` — profile-aware paths |

### Agent Loop (`run_agent.py`)

Synchronous loop inside `run_conversation()`:
1. Build system prompt (`agent/prompt_builder.py`) — skills, context files, memory
2. Call LLM (OpenAI-compatible API)
3. If tool calls: dispatch via `handle_function_call()`, append results, loop
4. If text: persist session, return
5. Context compression if approaching token limit (`agent/context_compressor.py`)

Messages follow OpenAI format. Reasoning content stored in `assistant_msg["reasoning"]`.

### Slash Command Registry

All slash commands are `CommandDef` entries in `hermes_cli/commands.py::COMMAND_REGISTRY`. This single source feeds CLI dispatch, gateway dispatch, Telegram menus, Slack routing, help text, and autocomplete automatically.

**Adding a slash command:** (1) Add `CommandDef` to `COMMAND_REGISTRY`, (2) add handler in `HermesCLI.process_command()`, (3) optionally add gateway handler in `gateway/run.py`.

### Plugin System

Three separate discovery systems — do NOT conflate them:

- **General plugins** (`hermes_cli/plugins.py`): discovered from `~/.hermes/plugins/`, `./.hermes/plugins/`, pip entry points. Register tools, lifecycle hooks (`pre_tool_call`, `post_tool_call`, `pre_llm_call`, `post_llm_call`, `on_session_start`, `on_session_end`), and CLI subcommands via `register(ctx)`.
- **Memory-provider plugins** (`plugins/memory/<name>/`): implement `MemoryProvider` ABC, orchestrated by `agent/memory_manager.py`.
- **Model-provider plugins** (`plugins/model-providers/<name>/`): lazy discovery on first `get_provider_profile()` call, NOT by the general PluginManager. User plugins override bundled ones (last-writer-wins).

**Rule:** plugins MUST NOT modify core files (`run_agent.py`, `cli.py`, `gateway/run.py`, `hermes_cli/main.py`). Expand plugin surface instead.

### TUI Architecture

`hermes --tui` (or `HERMES_TUI=1`) runs Node/Ink (`ui-tui/`) connected to Python (`tui_gateway/`) via newline-delimited JSON-RPC over stdio. TypeScript owns the screen; Python owns sessions, tools, model calls. **Do not re-implement the chat surface in React** — extend Ink instead; the dashboard embeds `hermes --tui` via PTY.

### Skills vs Tools

**Almost always make it a skill** (`skills/` or `optional-skills/`). Make it a tool only when it requires Python integration, auth flows managed by the harness, binary data/streaming, or real-time events.

Built-in tool registration requires two changes: (1) create `tools/your_tool.py` with `registry.register()`, (2) add tool name to a toolset in `toolsets.py`.

## Key Invariants

### Profile Safety
**Never hardcode `~/.hermes`**. Always use `get_hermes_home()` (from `hermes_constants`) for code paths and `display_hermes_home()` for user-facing messages. Profiles set `HERMES_HOME` before imports — hardcoding breaks multi-instance setups.

### Prompt Caching
Do NOT alter past context mid-conversation, change toolsets mid-conversation, or reload memories mid-conversation. Cache-breaking causes dramatically higher costs. Slash commands that mutate system-prompt state must defer to next session by default; use `--now` flag pattern for immediate invalidation.

### Config vs .env
Non-secret settings belong in `config.yaml` (add to `DEFAULT_CONFIG` in `hermes_cli/config.py`). Secrets only go in `.env` (add to `OPTIONAL_ENV_VARS` with metadata). Three different config loaders exist — `load_cli_config()` (CLI), `load_config()` (subcommands), direct YAML load (gateway); ensure your key is covered by the right one.

### Cross-Platform
Never use `os.kill(pid, 0)` — use `psutil.pid_exists(pid)`. Never assume POSIX tools exist on Windows. Guard `termios`/`fcntl`/`os.setsid` with try/except or platform checks. Use `pathlib.Path`. Run `scripts/check-windows-footguns.py` before PRs that touch file I/O or process management.

### Tests
Tests must not write to `~/.hermes/` — the `_isolate_hermes_home` autouse fixture in `tests/conftest.py` redirects `HERMES_HOME` to a temp dir. Tests that mock `Path.home()` must also set `HERMES_HOME` env var. Do not write change-detector tests (model catalog snapshots, config version literals, enumeration counts) — write invariant tests instead.

### Gateway Message Guards
Two sequential guards exist when an agent is running: base adapter (`gateway/platforms/base.py`) queues messages, then gateway runner (`gateway/run.py`) intercepts control commands. Commands that must reach the runner while an agent is blocked must bypass BOTH guards.

## User Configuration

All runtime state lives in `~/.hermes/` (or `$HERMES_HOME` for profiles):
- `config.yaml` — settings
- `.env` — API keys only
- `state.db` — SQLite sessions (FTS5)
- `skills/` — active skills
- `logs/` — `agent.log`, `errors.log`, `gateway.log`
- `skins/*.yaml` — custom themes

## Commit Style

Conventional Commits: `<type>(<scope>): <description>`. Types: `fix`, `feat`, `docs`, `test`, `refactor`, `chore`. Scopes: `cli`, `gateway`, `tools`, `skills`, `agent`, `install`, `security`.
