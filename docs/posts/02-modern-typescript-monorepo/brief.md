# Post 2 brief: A modern TypeScript monorepo

## Working title

**Building Harbr as a Modern TypeScript Monorepo**

- Historical work window: 25–26 June 2026
- Suggested length: 750–950 words
- Series role: explain the main technical choices without becoming a setup guide
- Status: ready for an editorial draft

## Thesis

Harbr used a TypeScript monorepo because the product had several distinct
responsibilities that needed to evolve together: domain language, config, Git,
tmux, scanning, reconciliation, persistence, and the TUI. Bun made the repository
quick to start and, importantly for a CLI/TUI, could compile the application into
standalone executables for distribution.

The first toolchain was intentionally pragmatic. ESLint, Prettier, TypeScript,
Vitest, and Turborepo provided familiar checks quickly. ESLint also enforced
dependency boundaries between packages. The team may move linting and formatting
to Oxlint and oxfmt later; present that as a direction to evaluate, not a
completed migration or a criticism of the initial choice.

## Reader takeaway

“Modern” here does not mean using the newest tool in every category. It means:

- a repository shape that mirrors product responsibilities;
- executable guardrails around dependency direction;
- a runtime and build tool suited to shipping a CLI;
- explicit service composition rather than hidden global dependencies;
- one repeatable check that gives humans and coding agents a trustworthy result.

## Suggested narrative

1. Start from the product shape, not a list of tools.
2. Explain why a monorepo was useful: a runtime action can touch a shared
   contract, an adapter, reconciliation, persistence, and UI in one coordinated
   change.
3. Introduce the package vocabulary briefly:
   `domain`, `config`, `git`, `runtime-tmux`, `scanner`, `reconciler`, `db`, and
   `apps/tui`.
4. Explain the Bun decision:
   - one package manager/runtime for the workspace;
   - direct TypeScript execution during development;
   - standalone executables for macOS/Linux and ARM64/x64;
   - users can run the shipped `harbr` binary without installing the project's
     JavaScript dependencies.
5. Introduce Effect lightly: packages expose service tags and live layers; the
   app composes them at the edge and creates one shared runtime.
6. Explain the initial guardrails: types, tests, formatting, lint rules, schema
   checks, migration checks, and import boundaries.
7. Close honestly: toolchain choices are revisitable; architecture boundaries
   and a trustworthy feedback loop matter more than loyalty to a formatter.

## Bun detail worth preserving

The build uses `Bun.build` with `compile`, bytecode, ESM, and minification. The
release script produces four archives:

- macOS ARM64
- macOS x64
- Linux ARM64
- Linux x64

This is the practical reason Bun belongs in the story. Avoid generic benchmark
claims unless independently measured for Harbr.

First-party Bun reference:

`https://bun.sh/docs/bundler/executables`

## Effect detail worth preserving

The architectural decision was not “put Effect everywhere.” It was:

- service contracts and live implementations belong at package boundaries;
- option services represent app-supplied runtime choices such as config and DB
  paths;
- the TUI composes concrete layers once;
- interactive actions request services from one long-lived runtime;
- test layers can replace live implementations without changing consumers.

One small code excerpt from the app composition is enough. Avoid teaching
`Layer`, `Context.Tag`, or `Effect.gen` exhaustively; post 4 returns to Effect in
the observability context.

## ESLint and Prettier nuance

- In June 2026 the repository used ESLint and Prettier because they were a fast,
  familiar starting point.
- `eslint-plugin-boundaries` made package dependency direction executable.
- Additional restricted-import rules kept config loading at the app edge and
  stopped the scanner reaching into concrete runtime internals.
- As of this handoff, the repository still declares ESLint and Prettier.
- The possible Oxlint/oxfmt move is prospective. Verify the repository and the
  tool names before publication.

## Avoid

- Do not claim Bun creates a native binary in the same sense as compiling Rust or
  Go; Bun's standalone executable includes the Bun runtime.
- Do not claim the initial lint/format choices were optimal or permanent.
- Do not turn the post into a package-by-package API reference.
- Do not say the monorepo is inherently better for every project.
- Do not imply Effect removes the need to understand dependency composition.

## Local evidence

- Historical root toolchain:
  `git show 27746039e:package.json`
- Historical TUI dependencies and scripts:
  `git show 27746039e:apps/tui/package.json`
- Historical boundary rules:
  `git show 27746039e:packages/config-eslint/base.mjs`
- Effect service-pattern refactor commit: `27746039e`
- Stored Effect architecture task:
  `/Users/andy/.codex/sessions/2026/06/25/rollout-2026-06-25T18-06-39-019effbf-7b32-7091-b17d-45e8a1b06f10.jsonl`
- Current build implementation:
  `/Users/andy/Sites/harbour/main/apps/tui/scripts/build.ts`
- Current cross-platform packaging:
  `/Users/andy/Sites/harbour/main/scripts/package-release.ts`
- Current app layer composition:
  `/Users/andy/Sites/harbour/main/apps/tui/src/services/layer.ts`
- Current shared Effect runtime:
  `/Users/andy/Sites/harbour/main/apps/tui/src/services/effect-runtime.ts`
- Current boundary configuration:
  `/Users/andy/Sites/harbour/main/packages/config-eslint/base.mjs`
- Architecture guide:
  `/Users/andy/Sites/harbour/main/.agents/skills/architecture/SKILL.md`
- Effect conventions:
  `/Users/andy/Sites/harbour/main/.agents/skills/effect-reference/SKILL.md`

## Suggested visual

A small editorial diagram is more useful than a code screenshot:

```text
apps/tui composes
  domain + config + git + runtime + scanner + reconciler + db
                         -> one executable
```

If the final writer creates it, keep it conceptual and do not imply every
package imports every other package.
