#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT HUP INT TERM

cat >"$temp_dir/harbr" <<'EOF'
#!/bin/sh
exit 0
EOF
chmod +x "$temp_dir/harbr"

output=$(
  PATH="$temp_dir:/usr/bin:/bin" \
    HERDR_BIN_PATH=/bin/echo \
    HERDR_WORKSPACE_ID=workspace-test \
    sh "$script_dir/open.sh"
)
expected='plugin pane open --plugin dev-town.harbr --entrypoint main --focus --env HERDR_ACTIVE_WORKSPACE_ID=workspace-test'

if [ "$output" != "$expected" ]; then
  printf '%s\n' "unexpected open command: $output" >&2
  exit 1
fi

if PATH="/usr/bin:/bin" HERDR_BIN_PATH=/bin/echo sh "$script_dir/open.sh" \
  >"$temp_dir/missing.log" 2>&1; then
  printf '%s\n' "missing harbr should fail" >&2
  exit 1
fi

if ! grep -Fq 'curl -fsSL https://dev-town.com/labs/harbr/install.sh | sh' "$temp_dir/missing.log"; then
  printf '%s\n' "missing harbr instructions omit the stable installer" >&2
  exit 1
fi

printf '%s\n' "Herdr plugin test: ok"
