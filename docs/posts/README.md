# Harbr editorial handoff

This directory is a source pack for an editorial writer producing a lightweight
Dev Town series about Harbr. It is not a set of finished blog posts.

## Intended series

1. `01-introducing-harbr`
2. `02-modern-typescript-monorepo`
3. `03-calm-terminal-ui-opentui`
4. `04-llm-feedback-loops-observability-guardrails`
5. `05-tracing-harbr-startup`
6. `06-taking-harbr-beyond-tmux`
7. `07-git-worktrees-workspace-identity`

The editorial order is deliberate even where implementation dates overlap. The
first three posts explain the product, repository, and interface. The next two
extract the observability and AI-feedback-loop lesson. The final posts show the
runtime model evolving and leave the worktree identity story until its current
edge case is understood.

## Instructions for the writer

1. Read this file, then the selected post's `brief.md` and any disclosed
   research or asset notes in that directory.
2. Treat the dates as historical work windows, not mandatory publication dates.
3. Verify any statement marked `verify before publication` against the current
   repository or linked first-party source.
4. Write a short engineering note, normally 500–900 words. Prefer one clear
   lesson, a small amount of product history, and no more code than the story
   needs.
5. Use the public spelling **Harbr**. It is pronounced “harbour.” Historical
   screenshots may still show the older `harbour` repository or session name.
6. Preserve the distinction between what existed at the historical stage, what
   exists now, and what was only exploratory.
7. Finish with a modest “what changed next” or “what we are watching” section.

Completion means the post is understandable to a technically curious reader
without prior knowledge of Harbr, every material claim is supported by the
brief's evidence, and future plans are presented as plans rather than shipped
features.

## Voice and level

- Lightweight, reflective, and almost changelog-like.
- Written from practical experience rather than as universal best practice.
- Product and engineering decisions first; implementation detail second.
- Honest about trade-offs and unfinished work.
- Avoid “revolutionary,” “instant,” “industry standard,” and unsupported claims
  of popularity or adoption.
- The broader theme is that modern software should expose useful feedback to
  both people and coding agents.

## Repository and historical access

Local repository root:

`/Users/andy/Sites/harbour/main`

Public repository:

`https://github.com/dev-town/harbr`

Useful top-level sources:

- `/Users/andy/Sites/harbour/main/README.md`
- `/Users/andy/Sites/harbour/main/docs/harbour-product-brief.md`
- `/Users/andy/Sites/harbour/main/docs/harbour-technical-architecture.md`
- `/Users/andy/Sites/harbour/main/.agents/skills/architecture/SKILL.md`
- `/Users/andy/Sites/harbour/main/.agents/skills/architecture/references/mental-model.md`
- `/Users/andy/Sites/harbour/main/.agents/skills/effect-reference/SKILL.md`

Historical files can be read without changing the checkout:

```sh
git show <commit>:<path>
git show --stat <commit>
git log --date=short -- <path>
```

Do not assume the present-day file is identical to the historical version. Each
brief names the most useful commits and stored Codex task histories.

## Asset provenance

The recovered June screenshots originated in the development conversations and
were committed to `docs/assets/readme` on 26 June 2026 in commit `9f81a6b70`.
Copies are placed with the relevant briefs so the directories remain useful if
exported independently.

Check every screenshot before publication for project names, paths, terminal
content, or other details that should be cropped or redacted.
