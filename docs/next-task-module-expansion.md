# Next Task: Workspace-Aware Module Expansion

## Goal

Implement the next read-model slice after config + git inspection.

Given a `ProjectConfig` and a real workspace path, Harbour should resolve configured module selectors into concrete modules.

## Why Next

- config now expresses module intent
- git now classifies repo kind
- the next product gap is turning selectors like `apps/` into real modules
- scanner work depends on this behavior

## Scope

Implement module expansion against a workspace path.

Support:

- `apps` => one explicit module named `apps`
- `apps/` => immediate child directories of `apps`, named by relative path
- `packages/` => immediate child directories of `packages`, named by relative path

Examples:

- `apps/cli`
- `apps/tui`
- `packages/config`

## Rules

- expansion runs against a real workspace path, not bare repo storage
- trailing `/` means expand immediate child dirs only
- no recursive expansion
- derived module names use relative paths
- explicit selectors stay as one module

## Likely Home

Start as a small helper in `scanner` or a tiny adjacent helper consumed by `scanner`.

Do not put expansion in `config`.
`config` owns authored intent, not resolved filesystem reality.

## Inputs

- `ProjectConfig`
- workspace root path

## Outputs

Normalized resolved module facts, suitable for scanner output.

## Defer

- worktree discovery
- branch/head state
- dirty state
- runtime mapping
- observability beyond basic inline debugging

## Acceptance

1. explicit selectors resolve as one module
2. children selectors resolve immediate child dirs only
3. derived names are relative paths
4. bare repos are supported by using a workspace path, not repo storage path
5. behavior is covered by tests
