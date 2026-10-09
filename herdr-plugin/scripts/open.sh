#!/bin/sh

set -eu

if ! command -v harbr >/dev/null 2>&1; then
  cat >&2 <<'EOF'
harbr is required but was not found on PATH.
Install it from https://dev-town.com/labs/harbr/ or run:
  curl -fsSL https://dev-town.com/labs/harbr/install.sh | sh
EOF
  exit 127
fi

set -- "$HERDR_BIN_PATH" plugin pane open \
  --plugin dev-town.harbr \
  --entrypoint main \
  --focus

if [ -n "${HERDR_WORKSPACE_ID:-}" ]; then
  set -- "$@" --env "HERDR_ACTIVE_WORKSPACE_ID=$HERDR_WORKSPACE_ID"
fi

exec "$@"
