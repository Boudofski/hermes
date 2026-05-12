#!/usr/bin/env bash
# Start the Hermes Adapter service from anywhere inside the repo.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HERMES_ROOT="$(dirname "$SCRIPT_DIR")"

# Activate venv if present
if [ -f "$HERMES_ROOT/.venv/bin/activate" ]; then
  source "$HERMES_ROOT/.venv/bin/activate"
elif [ -f "$HERMES_ROOT/venv/bin/activate" ]; then
  source "$HERMES_ROOT/venv/bin/activate"
fi

# Install adapter-specific deps if not present
python3 -c "import fastapi" 2>/dev/null || pip install -r "$SCRIPT_DIR/requirements.txt"

# Load .env if present
[ -f "$SCRIPT_DIR/.env" ] && export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)

export PYTHONPATH="$HERMES_ROOT"
PORT="${PORT:-8001}"

echo "Starting Hermes Adapter on port $PORT (MOCK_MODE=${MOCK_MODE:-false})"
cd "$SCRIPT_DIR"
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --reload
