#!/usr/bin/env bash

set -euo pipefail

PORT="${PORT:-8000}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD="python"
else
  echo "Erro: Python 3 não encontrado. Instale o Python ou execute o projeto com outro servidor local." >&2
  exit 1
fi

echo "Iniciando servidor local em http://localhost:${PORT}"
echo "Pressione Ctrl+C para encerrar."

"$PYTHON_CMD" -m http.server "$PORT"