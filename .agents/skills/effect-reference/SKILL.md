---
name: effect-reference
description: Use when writing, reviewing, or refactoring Effect code in Harbour, including Effect.gen, Layer, Context.Tag, services, errors, schemas, runtime wiring, tests, or idiomatic Effect API usage. Inspect vendored Effect source before choosing unfamiliar Effect patterns.
---

# Effect Reference

Use this skill for Harbour changes involving Effect APIs or idioms.

## Source Of Truth

Harbour vendors Effect source under `vendor/effect`.

- Treat `vendor/effect` as read-only reference material.
- Do not edit files under `vendor/effect` unless explicitly asked.
- Do not import from `vendor/effect`; import from the installed `effect` package.
- Prefer patterns that match Harbour's pinned Effect version in `package.json`.

## Workflow

1. Check Harbour's existing Effect usage first.
2. For unfamiliar APIs or patterns, inspect `vendor/effect`.
3. Prefer examples from Effect tests and package source over guesses.
4. Keep Harbour package boundaries from the `architecture` skill intact.

## Harbour Conventions

- Put service contracts in `services/*.service.ts`.
- Put live layers and wiring in `services/*.live.ts`.
- Keep `index.ts` export-only.
- Use package errors in `*.errors.ts`.
- Test Effect programs with explicit layers and `Effect.runPromise` where appropriate.
