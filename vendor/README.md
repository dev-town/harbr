# Vendored Reference Source

This directory contains third-party source code used as local reference material for coding agents.

## `vendor/effect`

`vendor/effect` is a vendored copy of the Effect source repository. It is present so agents can inspect real Effect implementation, tests, and idiomatic usage while working on Harbr.

This follows the workflow described by Effect: https://effect.website/blog/the-one-weird-git-trick-that-makes-coding-agents-more-effect-ive/

Rules:

- Treat `vendor/effect` as read-only reference material.
- Do not edit files under `vendor/effect` unless explicitly asked.
- Do not import from `vendor/effect`; Harbr code imports from the installed `effect` package.
- Do not treat vendored examples, workflows, docs, or tests as first-party Harbr project health signals.
- Exclude `vendor/**` from release artifacts.

See `NOTICE` for third-party license attribution.
