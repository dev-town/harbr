# Changesets

Add a changeset for user-facing feature, fix, and security PRs:

```sh
bun changeset
```

For Harbr binary releases, select `@harbr/tui`. Changesets ignores the unversioned internal workspace packages; their changes are released as part of the binary.

The `Version Packages` workflow converts pending changesets into package version bumps and changelog updates. Release tags are created manually after that version PR is merged.
