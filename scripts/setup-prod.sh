#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

if ! command -v uv >/dev/null 2>&1; then
  echo "未找到 uv。请先以部署用户执行: curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "未找到 npm，请安装 Node.js 20+" >&2
  exit 1
fi

echo "同步 Python 依赖..."
uv --directory backend sync --frozen

echo "安装并构建前端..."
npm --prefix frontend ci
npm --prefix frontend run build

mkdir -p backend/data

if [[ ! -f deploy/model-trainer.env ]]; then
  cp deploy/model-trainer.env.example deploy/model-trainer.env
  echo "已生成 deploy/model-trainer.env，请填写 SECRET_KEY 和 ADMIN_PASSWORD 后再启动。"
fi

echo "构建完成。启动: ./scripts/run-prod.sh"
echo "或安装 systemd: sudo cp deploy/model-trainer.service /etc/systemd/system/ && sudo systemctl daemon-reload"
