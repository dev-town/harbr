---
name: effect-reference
description: Use when writing, reviewing, or refactoring Effect code in Harbour, including Effect.gen, Layer, Context.Service, services, errors, schemas, runtime wiring, tests, or idiomatic Effect API usage. Inspect the installed Effect version before choosing unfamiliar patterns.
---

# Effect Reference

Use this skill for Harbour changes involving Effect APIs or idioms.

## Source Of Truth

Use Harbour's installed `effect` package and the version pinned in `package.json` as the API reference. `vendor/effect` contains the older v3 source and is useful only for comparing pre-migration behavior.

- Import from the installed `effect` package.
- Treat `vendor/effect` as read-only historical reference material.

## Workflow

1. Check Harbour's existing Effect usage first.
2. For unfamiliar APIs or patterns, inspect `node_modules/effect` and [the official migration guide](https://github.com/Effect-TS/effect/blob/main/MIGRATION.md) when a v3 API is involved.
3. Prefer examples from the installed package source and types over guesses.
4. Keep Harbour package boundaries from the `architecture` skill intact.

## Harbour Conventions

- Put service contracts in `services/*.service.ts`.
- Put live layers and wiring in `services/*.live.ts`.
- Public packages should export `Context.Service` keys, API types, option services where needed, and live layers.
- Do not add package-level helper functions that secretly `Effect.provide` live layers.
- Prefer constant live layers. Use `make*` functions for app lifecycle constructors, not no-op wrappers around package layers.
- Represent app-provided runtime options as option services when they participate in Layer composition.
- App surfaces should compose package layers once, create one shared runtime for interactive apps, and request services with explicit `Effect.gen` / `yield* Service`.
- Keep `index.ts` export-only.
- Use package errors in `*.errors.ts`.
- Test Effect programs with explicit layers and `Effect.runPromise` where appropriate.
