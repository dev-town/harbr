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

if [ "$operating_system" = darwin ] && command -v sysctl >/dev/null 2>&1 &&
  [ "$(sysctl -n hw.optional.arm64 2>/dev/null || true)" = 1 ]; then
  architecture=arm64
else
  case "$(uname -m)" in
    x86_64 | amd64) architecture=x64 ;;
    arm64 | aarch64) architecture=arm64 ;;
    *) fail "unsupported test architecture" ;;
  esac
fi

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

mock_bin="$temporary_dir/mock-bin"
rosetta_target=darwin-arm64
rosetta_artifact="harbr-$version-$rosetta_target.tar.gz"
rosetta_release_dir="$temporary_dir/rosetta-releases/v$version"
rosetta_fixture_dir="$temporary_dir/rosetta-fixture/harbr-$version-$rosetta_target"
rosetta_install_dir="$temporary_dir/rosetta-bin"

mkdir -p "$mock_bin" "$rosetta_release_dir" "$rosetta_fixture_dir"
cat > "$mock_bin/uname" <<'EOF'
#!/bin/sh
case "$1" in
  -s) printf 'Darwin\n' ;;
  -m) printf 'x86_64\n' ;;
esac
EOF
cat > "$mock_bin/sysctl" <<'EOF'
#!/bin/sh
[ "$1" = '-n' ] && [ "$2" = 'hw.optional.arm64' ] || exit 1
printf '1\n'
EOF
chmod +x "$mock_bin/uname" "$mock_bin/sysctl"
cp "$fixture_dir/harbr" "$rosetta_fixture_dir/harbr"
tar -czf "$rosetta_release_dir/$rosetta_artifact" -C "$temporary_dir/rosetta-fixture" \
  "harbr-$version-$rosetta_target"
rosetta_checksum=$(calculate_sha256 "$rosetta_release_dir/$rosetta_artifact")
printf '%s  %s\n' "$rosetta_checksum" "$rosetta_artifact" > "$rosetta_release_dir/SHA256SUMS"

PATH="$mock_bin:$PATH" HARBR_VERSION="$version" \
  HARBR_RELEASE_BASE_URL="file://$temporary_dir/rosetta-releases" \
  HARBR_INSTALL_DIR="$rosetta_install_dir" \
  sh scripts/install.sh >/dev/null
[ "$("$rosetta_install_dir/harbr")" = "harbr $version" ] || \
  fail "installer did not select ARM hardware from a translated shell"

printf 'installer test: ok\n'
