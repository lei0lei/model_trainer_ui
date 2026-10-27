#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:$PATH"

if ! command -v uv >/dev/null 2>&1; then
  echo "未找到 uv。请先执行: curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "未找到 npm，请先安装 Node.js" >&2
  exit 1
fi

echo "同步后端依赖..."
uv --directory backend sync

if [[ ! -d frontend/node_modules ]]; then
  echo "安装前端依赖..."
  npm --prefix frontend install
fi

if [[ ! -d node_modules/concurrently ]]; then
  echo "安装根目录启动依赖..."
  npm install
fi

echo "启动前后端: API http://127.0.0.1:8000  前端 http://localhost:5173"
npm run dev
