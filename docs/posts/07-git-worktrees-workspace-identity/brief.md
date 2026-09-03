# Post 7 brief: Worktrees and workspace identity

## Working title

**Git Worktrees, Coding Agents, and the Problem of Workspace Identity**

- Historical roots: 7–12 July 2026
- Current status: hold until the newly observed multi-workspace/main-branch bug
  is diagnosed and fixed
- Suggested eventual length: 650–850 words
- Series role: follow-up grounded in a complete bug-and-fix story

## Why this post is on hold

The original question was where Harbr-created worktrees should live. The more
interesting current question is identity: how should Harbr distinguish several
valid working copies when paths, directory names, repository roots, and branch
names are not individually unique enough?

The user has observed an unresolved case involving multiple workspaces that can
look like `main`. Do not invent the cause or publish the current model as settled.
The final post should be written only after the repository contains a diagnosis,
a regression test, and a verified fix.

## Existing historical story

In July, the project compared two broad storage choices:

- project-adjacent worktrees, easy to see and open;
- centrally managed worktrees under Harbr's local data directory, predictable
  for a tool creating workspaces across many repositories.

Harbr chose:

```text
~/.local/share/harbr/worktrees/<project>/<workspace>
```

Git remains the source of truth for discovering worktrees wherever they exist;
the managed directory is only the default location for worktrees Harbr creates.

## Intended thesis after the bug is fixed

AI coding agents make parallel working copies more common, so “folder equals
workspace” and “branch name equals workspace” become fragile assumptions. A
workspace orchestrator needs an explicit identity model that can reconcile Git's
facts with human-friendly project and workspace names.

The exact final thesis must follow the diagnosis. Possible identity inputs to
evaluate—not predetermined answers—include:

- canonical repository/common Git directory;
- Git worktree administrative identity;
- canonical worktree path;
- branch ref or detached HEAD;
- Harbr project configuration identity;
- Harbr-created workspace metadata;
- external runtime ID.

## Questions the diagnosing task must answer

1. What exact sequence creates the duplicate or ambiguous `main` workspaces?
2. Are they worktrees of one common Git repository or separate clones?
3. Which current identifier collides: project name, branch, directory basename,
   canonical path, Git dir, or stored runtime binding?
4. What does `git worktree list --porcelain` report for each copy?
5. Which layer makes the wrong decision: Git adapter, scanner normalisation,
   reconciler binding, DB key, or TUI projection?
6. What identity should remain stable if a directory is renamed or a runtime pane
   changes CWD?
7. How should stale worktree metadata be pruned without deleting valid cached
   state during a transient failure?

Completion for the future diagnosis means a red regression test reproduces the
ambiguity, the fix makes it green, and the article can accurately explain both
the original assumption and the revised model.

## Suggested eventual narrative

1. Explain why agents increase the number of simultaneous workspaces.
2. Revisit the July storage-location decision.
3. Tell the concrete multiple-`main` bug story.
4. Explain why path, branch, and display name are different concepts.
5. Show the corrected identity/reconciliation rule at a high level.
6. Close with the practical lesson: managed location is useful, but placement and
   identity are separate design problems.

## Avoid until diagnosis

- Do not state the cause of the current bug.
- Do not recommend a new key or schema based only on this brief.
- Do not claim managed storage prevents identity collisions.
- Do not imply Git worktrees normally allow the same branch to be checked out
  repeatedly without explaining the exact mechanism observed.
- Do not conflate a clone, a bare repo, a linked worktree, and a runtime session.

## Existing local evidence

- Worktree-location exploration task:
  `/Users/andy/.codex/sessions/2026/07/07/rollout-2026-07-07T21-31-10-019f3e47-0856-7c61-9895-6d91e8524740.jsonl`
- Managed-directory implementation commit: `9f175cf4e`
- Current worktree contracts:
  `/Users/andy/Sites/harbour/main/packages/domain/src/worktree.contracts.ts`
- Current Git worktree implementation:
  `/Users/andy/Sites/harbour/main/packages/git/src/git.worktree.ts`
  `/Users/andy/Sites/harbour/main/packages/git/src/services/git.live.ts`
- Workspace creation use case:
  `/Users/andy/Sites/harbour/main/apps/tui/src/use-cases/create-workspace.ts`
- Scanner mapping:
  `/Users/andy/Sites/harbour/main/packages/scanner/src/scanner.observe.ts`
- Durable project snapshot storage:
  `/Users/andy/Sites/harbour/main/packages/db/src/repos/project-snapshot.repo.ts`
- Runtime binding reconciliation:
  `/Users/andy/Sites/harbour/main/packages/reconciler/src/reconciler.runtimes.ts`

## Assets

Do not create diagrams of the identity model until the bug is diagnosed. The
eventual article would benefit from a small “same branch label, distinct working
copies” diagram derived from the regression fixture.
