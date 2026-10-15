#!/bin/sh
set -eu

want=$(sha256sum package-lock.json | cut -d ' ' -f 1)
have=$(cat node_modules/.package-lock.sha256 2>/dev/null || true)

if [ "$want" != "$have" ]; then
  npm ci
  printf '%s\n' "$want" > node_modules/.package-lock.sha256
fi

exec npx vite --host 0.0.0.0 --port 5173
