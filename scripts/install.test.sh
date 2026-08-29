#!/bin/sh

set -eu

fail() {
  printf 'installer test: %s\n' "$*" >&2
  exit 1
}

calculate_sha256() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{ print $1 }'
  else
    shasum -a 256 "$1" | awk '{ print $1 }'
  fi
}

case "$(uname -s)" in
  Darwin) operating_system=darwin ;;
  Linux) operating_system=linux ;;
  *) fail "unsupported test operating system" ;;
esac

case "$(uname -m)" in
  x86_64 | amd64) architecture=x64 ;;
  arm64 | aarch64) architecture=arm64 ;;
  *) fail "unsupported test architecture" ;;
esac

version=9.8.7-test.1
target="$operating_system-$architecture"
artifact="harbr-$version-$target.tar.gz"
temporary_dir=$(mktemp -d "${TMPDIR:-/tmp}/harbr-installer-test.XXXXXX")
trap 'rm -rf "$temporary_dir"' EXIT
release_dir="$temporary_dir/releases/v$version"
fixture_dir="$temporary_dir/fixture/harbr-$version-$target"
install_dir="$temporary_dir/bin"

mkdir -p "$release_dir" "$fixture_dir"
printf '#!/bin/sh\nprintf '\''harbr %s\\n'\'' '\''%s'\''\n' "$version" > "$fixture_dir/harbr"
chmod 755 "$fixture_dir/harbr"
tar -czf "$release_dir/$artifact" -C "$temporary_dir/fixture" "harbr-$version-$target"
checksum=$(calculate_sha256 "$release_dir/$artifact")
printf '%s  %s\n' "$checksum" "$artifact" > "$release_dir/SHA256SUMS"

output=$(HARBR_VERSION="$version" \
  HARBR_RELEASE_BASE_URL="file://$temporary_dir/releases" \
  HARBR_INSTALL_DIR="$install_dir" \
  sh scripts/install.sh)

[ -x "$install_dir/harbr" ] || fail "installer did not create an executable"
[ "$("$install_dir/harbr")" = "harbr $version" ] || fail "installed binary did not run"
printf '%s\n' "$output" | grep -F "Installed harbr $version" >/dev/null || \
  fail "installer did not report success"

bad_install_dir="$temporary_dir/bad-bin"
printf '%064d  %s\n' 0 "$artifact" > "$release_dir/SHA256SUMS"
if HARBR_VERSION="$version" \
  HARBR_RELEASE_BASE_URL="file://$temporary_dir/releases" \
  HARBR_INSTALL_DIR="$bad_install_dir" \
  sh scripts/install.sh >"$temporary_dir/bad-output" 2>&1; then
  fail "installer accepted an invalid checksum"
fi
[ ! -e "$bad_install_dir/harbr" ] || fail "installer installed an unverified binary"
grep -F "checksum verification failed" "$temporary_dir/bad-output" >/dev/null || \
  fail "installer did not explain the checksum failure"

printf 'installer test: ok\n'
