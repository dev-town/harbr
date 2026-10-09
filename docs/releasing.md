# Releasing Harbr

Harbr ships a versioned binary through GitHub Releases. The installer on
`dev-town.com` downloads the latest stable GitHub release by default, and the
`dev-town/tap` Homebrew formula points at the same release archives. The private
workspace packages and `@harbr/tui` are not published to npm.

## First stable release

`v0.1.0-beta.8` is the final beta. The `0.1.0` release changes remove
Changesets prerelease mode, consolidate the beta changesets into the `0.1.0`
changelog entry, and leave the internal workspace packages unversioned. Review
the `0.1.0` package version and changelog before tagging.

## Prepare a later release

1. Include a changeset in each user-facing feature, fix, or security PR. Select
   `@harbr/tui` and choose the appropriate SemVer change. The internal workspace
   packages are ignored by Changesets because they have no package versions.
2. Merge the changes to `main`. The `Version Packages` workflow opens or updates
   a PR with the next version and changelog entry.
3. Review and merge that PR. Confirm the version in
   `apps/tui/package.json` and the matching heading in
   `apps/tui/CHANGELOG.md`.

## Check the release candidate

Run the normal checks and exercise the native archive on the current machine:

```sh
bun run check
bun run package:release
sh scripts/smoke-release.sh 0.1.0
```

Replace `0.1.0` with the version in `apps/tui/package.json`. The smoke script
installs the packaged archive from a local `file://` release fixture, verifies
its checksum, and runs `harbr --version`. The tag workflow repeats this check
on Linux x64/ARM64 and macOS x64/ARM64 before publication.

Before the first stable tag, check that the Harbr repository has a
`HOMEBREW_TAP_TOKEN` Actions secret with permission to push to
`dev-town/homebrew-tap`. The stable release workflow fails before publishing if
that secret is missing. It updates the tap automatically after publishing the
GitHub release. The workflow accepts only stable `vMAJOR.MINOR.PATCH` tags.

The website serves its installer from the DevTown website repository at
`apps/website/public/labs/harbr/install.sh`. That file is a copy of this
repository's `scripts/install.sh`; it does not need updating for each release.
When the installer itself changes, copy the new script to the website repository
and merge it there. The website deploys on pushes to its `main` branch. Check
that the public script matches this repository before the first stable release:

```sh
curl -fsSL https://dev-town.com/labs/harbr/install.sh | cmp - scripts/install.sh
```

## Publish

Once the versioned commit is on `main`, create and push a matching tag:

```sh
git tag -a v0.1.0 -m 'harbr v0.1.0'
git push origin v0.1.0
```

Use the current package version in place of `0.1.0` for later releases. The
tag workflow checks the tag against `apps/tui/package.json`, runs the project
checks, builds the four archives and checksums, smoke tests the native archive
on each supported platform, publishes GitHub release notes from the changelog,
and updates the stable Homebrew tap formula.

After the workflow succeeds, verify the GitHub release assets and run the
public installer on a clean machine. Check `harbr --version`, then check that
`brew info dev-town/tap/harbr` reports the same version and that a fresh
`brew install dev-town/tap/harbr` works. If publication fails after the GitHub
release is created, rerun the workflow for the same tag after fixing the
failure. If a published binary is defective, release a new patch version
instead of moving the existing tag.
