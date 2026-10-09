#!/bin/sh

set -eu

version=${1:-}
[ -n "$version" ] || {
  printf 'Usage: sh scripts/smoke-release.sh <version>\n' >&2
  exit 1
}
[ -f dist/release/SHA256SUMS ] || {
  printf 'Package release artifacts before running the smoke test.\n' >&2
  exit 1
}

release_dir=$(pwd)/dist/release
temporary_dir=$(mktemp -d "${TMPDIR:-/tmp}/harbr-release-smoke.XXXXXX")
trap 'rm -rf "$temporary_dir"' EXIT HUP INT TERM

mkdir -p "$temporary_dir/releases"
ln -s "$release_dir" "$temporary_dir/releases/v$version"

HARBR_VERSION="$version" \
  HARBR_RELEASE_BASE_URL="file://$temporary_dir/releases" \
  HARBR_INSTALL_DIR="$temporary_dir/bin" \
  sh scripts/install.sh

actual_version=$("$temporary_dir/bin/harbr" --version)
[ "$actual_version" = "harbr $version" ] || {
  printf 'Expected harbr %s, got %s\n' "$version" "$actual_version" >&2
  exit 1
}

printf 'Release smoke test passed: %s\n' "$actual_version"
