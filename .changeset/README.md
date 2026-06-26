# Changesets

Add a changeset for user-facing feature, fix, and security PRs:

```sh
bun changeset
```

For Harbr binary releases, select `@harbr/tui`. Internal workspace packages are private implementation details unless a change intentionally tracks their versions.

The `Version Packages` workflow converts pending changesets into package version bumps and changelog updates. Release tags are created manually after that version PR is merged.
