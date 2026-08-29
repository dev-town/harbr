#!/bin/sh

set -eu

repository_url="https://github.com/dev-town/harbr"
release_base_url="${HARBR_RELEASE_BASE_URL:-$repository_url/releases/download}"
latest_release_url="${HARBR_LATEST_RELEASE_URL:-$repository_url/releases/latest}"
install_dir="${HARBR_INSTALL_DIR:-$HOME/.local/bin}"

say() {
  printf '%s\n' "$*"
}

fail() {
  printf 'harbr installer: %s\n' "$*" >&2
  exit 1
}

has_command() {
  command -v "$1" >/dev/null 2>&1
}

download() {
  source_url=$1
  destination=$2

  curl -fsSL \
    --retry 3 \
    --retry-delay 1 \
    --connect-timeout 10 \
    -o "$destination" \
    "$source_url"
}

resolve_version() {
  if [ -n "${HARBR_VERSION:-}" ]; then
    printf '%s\n' "${HARBR_VERSION#v}"
    return
  fi

  resolved_url=$(curl -fsSL \
    --retry 3 \
    --retry-delay 1 \
    --connect-timeout 10 \
    -o /dev/null \
    -w '%{url_effective}' \
    "$latest_release_url")
  resolved_tag=${resolved_url##*/}

  case "$resolved_tag" in
    v*) printf '%s\n' "${resolved_tag#v}" ;;
    *) fail "could not determine the latest stable release" ;;
  esac
}

detect_target() {
  case "$(uname -s)" in
    Darwin) operating_system=darwin ;;
    Linux) operating_system=linux ;;
    *) fail "unsupported operating system: $(uname -s)" ;;
  esac

  case "$(uname -m)" in
    x86_64 | amd64) architecture=x64 ;;
    arm64 | aarch64) architecture=arm64 ;;
    *) fail "unsupported architecture: $(uname -m)" ;;
  esac

  printf '%s-%s\n' "$operating_system" "$architecture"
}

calculate_sha256() {
  file=$1

  if has_command sha256sum; then
    sha256sum "$file" | awk '{ print $1 }'
  elif has_command shasum; then
    shasum -a 256 "$file" | awk '{ print $1 }'
  else
    fail "sha256sum or shasum is required to verify the download"
  fi
}

has_command curl || fail "curl is required"
has_command tar || fail "tar is required"
has_command install || fail "install is required"

version=$(resolve_version)
case "$version" in
  "" | *[!0-9A-Za-z.+_-]*) fail "invalid version: $version" ;;
esac

target=$(detect_target)
artifact="harbr-$version-$target.tar.gz"
release_url="${release_base_url%/}/v$version"

temporary_dir=$(mktemp -d "${TMPDIR:-/tmp}/harbr-install.XXXXXX")
staged_binary=
cleanup() {
  rm -rf "$temporary_dir"
  if [ -n "$staged_binary" ]; then
    rm -f "$staged_binary"
  fi
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM

archive_path="$temporary_dir/$artifact"
checksums_path="$temporary_dir/SHA256SUMS"

say "Downloading harbr $version for $target..."
download "$release_url/$artifact" "$archive_path"
download "$release_url/SHA256SUMS" "$checksums_path"

expected_checksum=$(awk -v artifact="$artifact" '
  $2 == artifact || $2 == "*" artifact { print $1; exit }
' "$checksums_path")
[ -n "$expected_checksum" ] || fail "SHA256SUMS has no checksum for $artifact"

actual_checksum=$(calculate_sha256 "$archive_path")
[ "$actual_checksum" = "$expected_checksum" ] || fail "checksum verification failed for $artifact"

tar -xzf "$archive_path" -C "$temporary_dir"
binary_path="$temporary_dir/harbr-$version-$target/harbr"
[ -f "$binary_path" ] || fail "release archive does not contain the harbr binary"

mkdir -p "$install_dir"
staged_binary="$install_dir/.harbr-install.$$"
install -m 755 "$binary_path" "$staged_binary"
mv -f "$staged_binary" "$install_dir/harbr"
staged_binary=

say "Installed harbr $version to $install_dir/harbr"

case ":${PATH:-}:" in
  *":$install_dir:"*) ;;
  *)
    say ""
    say "Add $install_dir to PATH, then run:"
    say "  harbr --version"
    ;;
esac
