#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

ENV_FILE="$ROOT/deploy/model-trainer.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

export FRONTEND_DIST="${FRONTEND_DIST:-$ROOT/frontend/dist}"
if [[ ! -f "$FRONTEND_DIST/index.html" ]]; then
  echo "前端未构建，请先运行: $ROOT/scripts/setup-prod.sh" >&2
  exit 1
fi

cd "$ROOT/backend"
exec uv run uvicorn model_trainer_backend.main:app \
  --host "${HOST:-0.0.0.0}" \
  --port "${PORT:-8000}"
