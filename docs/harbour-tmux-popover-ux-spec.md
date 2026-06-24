# Harbr Tmux Popover UX Specification

## Purpose

Harbr should provide a fast, terminal-native way to resume, switch, and create project workspaces from inside `tmux`.

The interface is a **drillable fuzzy list** shown inside a `tmux` popup.

The main goal:

> Open Harbr, type a few characters, press Enter, and land in the right working context.

Harbr should optimise for:

- Resuming active work
- Switching between projects, workspaces, and modules
- Creating new worktrees/workspaces
- Attaching to existing tmux sessions
- Creating sessions where none exist yet
- Keeping project/workspace/module context sticky between invocations

---

## 1. Core Hierarchy

Harbr models work as:

```txt
Project
  Workspace
    Module
      Session
```

### Project

A configured repository.

Examples:

```txt
harbr
notes-api
website
```

A project owns:

- The root repository path
- Module definitions, if any
- Workspaces/worktrees
- Project-level actions

### Workspace

A workspace is a checkout of a project.

There is always at least one workspace:

```txt
default workspace = the project root
```

Additional workspaces are usually git worktrees.

Examples:

```txt
main
feature/auth-flow
fix/db-sync
docs/planning
```

Internally, even a project with no extra worktrees has a workspace:

```txt
Project: harbr
Workspace: default/root/main
```

But the default workspace should usually be hidden in the UI when it is the only workspace.

### Module

A module is a configured subpath inside a workspace.

Examples:

```txt
apps/tui
apps/web
packages/git
packages/scanner
packages/reconciler
```

Modules are defined at the project level, but instantiated inside a workspace.

```txt
Module definition:
  packages/git

Module instance:
  harbr / feature/auth-flow / packages/git
```

Standard repos may have no modules. In that case, the openable unit is the project root or workspace root.

### Session

A session is a running tmux context associated with a project, workspace, or module.

Most commonly:

```txt
module session = tmux session/window rooted at workspace/module path
workspace session = tmux session/window rooted at workspace root
project session = tmux session/window rooted at project root
```

Rows should indicate whether a session already exists.

---

## 2. Interface Shape

Harbr runs as a tmux popup.

Example launcher:

```sh
tmux display-popup -E harbr
```

The popup has four main areas:

1. Breadcrumb/context header
2. Query input
3. Filtered result list
4. Footer/help/actions hint

Example:

```txt
┌────────────────────────────────────────────────────────┐
│ harbr › feature/auth-flow        Modules · Active    │
│ > db                                                   │
│                                                        │
│ ● packages/db        module      session               │
│ ○ packages/git       module      no session            │
│ ○ packages/config    module      no session            │
│                                                        │
│ Enter open/select · Tab active/all · ? actions         │
└────────────────────────────────────────────────────────┘
```

---

## 3. Mental Model

Harbr is a **drillable fuzzy list**, not a pure command palette.

Typing filters the current list.

Navigation drills through the hierarchy:

```txt
Project → Workspace → Module
```

But Harbr skips unnecessary layers.

Examples:

```txt
Project with no extra workspaces and no modules:
  show projects

Project with modules but no extra workspaces:
  show modules directly

Project with workspaces but no modules:
  show workspaces

Project with workspaces and modules:
  if workspace selected: show modules inside workspace
  if no workspace selected: show workspaces first
```

---

## 4. Sticky Context

Harbr remembers the last selected context.

```ts
type HarbrContext = {
  projectId?: ProjectId
  workspaceId?: WorkspaceId
  moduleId?: ModuleId
}
```

This context is sticky across invocations.

If the user last worked in:

```txt
harbr / feature/auth-flow / packages/db
```

Then opening Harbr again should prefer:

```txt
Project: harbr
Workspace: feature/auth-flow
Section: Modules
Filter: Active or All
```

The user should usually be dropped into the most useful list for the remembered context.

---

## 5. Sections

The UI has a current section.

```ts
type Section = 'projects' | 'workspaces' | 'modules' | 'actions'
```

Each section has:

- A scope
- A list of rows
- A visibility filter
- A query

Examples:

```txt
Section: Projects
Scope: global

Section: Workspaces
Scope: project harbr

Section: Modules
Scope: project harbr, workspace feature/auth-flow
```

---

## 6. Default Section Resolution

When Harbr opens, choose the default section using the current context and repo shape.

```ts
function getDefaultSection(context, shape): Section {
  if (context.projectId && shape.hasModules && context.workspaceId) {
    return 'modules'
  }

  if (context.projectId && shape.hasWorkspaces) {
    return 'workspaces'
  }

  if (context.projectId && shape.hasModules) {
    return 'modules'
  }

  return 'projects'
}
```

Rules:

| Repo shape                               | Current workspace selected? | Default section |
| ---------------------------------------- | --------------------------: | --------------- |
| Standard repo, no workspaces, no modules |                         N/A | Projects        |
| Standard repo, workspaces, no modules    |                      No/yes | Workspaces      |
| Monorepo, no extra workspaces            |  Default workspace implicit | Modules         |
| Monorepo with workspaces                 |                         Yes | Modules         |
| Monorepo with workspaces                 |                          No | Workspaces      |

Important rule:

> If a workspace is already active/selected, open in module mode. If no workspace is selected yet, fall back to workspace selection.

---

## 7. Default Workspace

Every project has a default workspace.

```ts
type WorkspaceKind = 'default' | 'worktree'

type Workspace = {
  id: WorkspaceId
  projectId: ProjectId
  kind: WorkspaceKind
  name: string
  path: string
  branch?: string
  isDefault: boolean
}
```

If a project has only the default workspace, skip the workspace layer visually.

Instead of:

```txt
harbr › default › packages/git
```

Show:

```txt
harbr › packages/git
```

If a project has multiple workspaces, show workspace names where needed:

```txt
harbr › main › packages/git
harbr › feature/auth-flow › packages/git
```

---

## 8. Breadcrumbs

The header should show the current context.

Examples:

```txt
Projects · Active
harbr        Workspaces · Active
harbr › feature/auth-flow        Modules · Active
harbr › feature/auth-flow › packages/db        Actions
```

Breadcrumbs should answer:

- Which project am I in?
- Which workspace am I in?
- Which module am I in?
- Which section am I viewing?
- Am I seeing Active or All?

Suggested compact format:

```txt
[harbr] [feature/auth-flow] [packages/db]    Modules · Active
```

or:

```txt
harbr › feature/auth-flow › packages/db      Modules · Active
```

---

## 9. Active / All Visibility Filter

The visibility filter is scoped to the current section.

It is not a global filter.

```ts
type VisibilityFilter = 'active' | 'all'
```

### Project section

```txt
Active = projects with active descendant sessions
All    = all projects
```

### Workspace section

```txt
Active = workspaces in the selected project with active descendant sessions
All    = all workspaces in the selected project
```

### Module section

```txt
Active = modules in the selected workspace with active sessions
All    = all modules in the selected workspace
```

Example:

```txt
Breadcrumb: harbr › feature/auth-flow
Section: Modules
Filter: Active
```

Rows:

```txt
● apps/web          module      session
● packages/db       module      session
```

Toggle to All:

```txt
● apps/web          module      session
● packages/db       module      session
○ packages/git      module      no session
○ packages/config   module      no session
○ packages/scanner  module      no session
```

The scope did not change. Only the visibility filter changed.

### Default Filter

Default to `Active` if the current section has active items.

If there are no active items, automatically show `All`.

```ts
function getDefaultVisibility(items): VisibilityFilter {
  return items.some((item) => item.isActive) ? 'active' : 'all'
}
```

Avoid opening to an empty Active list.

---

## 10. Row Rendering

Rows should be compact but informative.

Suggested row shape:

```txt
<status> <label> <kind> <metadata>
```

Examples:

```txt
● packages/db        module      session
○ packages/git       module      no session
● feature/auth-flow  workspace   2 sessions
○ fix/db-sync        workspace   no sessions
● harbr            project     5 sessions
```

### Status Indicators

MVP:

```txt
● active session exists
○ no active session
```

Potential future states:

```txt
● attached/current
◐ running/detached
○ inactive
! dirty/error
```

### Row Kinds

Rows should include kind labels:

```txt
project
workspace
module
action
```

---

## 11. Typing and Filtering

Typing filters the current section only.

Project section:

```txt
Projects · All
> har

harbr      project
```

Workspace section:

```txt
harbr        Workspaces · All
> auth

feature/auth-flow    workspace
fix/auth-redirect    workspace
```

Module section:

```txt
harbr › feature/auth-flow        Modules · All
> db

packages/db          module
```

Typing should not unexpectedly jump to another section.

---

## 12. Keyboard Controls

Suggested controls:

```txt
j / Down       move selection down
k / Up         move selection up

l / Right      drill/select current row
h / Left       go back one section

Enter          select/drill/open based on row and known depth
Tab            toggle Active / All for current section

?              open actions menu for selected row/current context
Ctrl+A         open actions menu for selected row/current context

Esc            clear query, or go back, or close
```

### Escape Behaviour

```txt
If query is non-empty:
  clear query

Else if section has a parent:
  go back to parent section

Else:
  close popup
```

Examples:

```txt
Modules → Workspaces → Projects → Close
```

If workspace layer is implicit because there is only a default workspace:

```txt
Modules → Projects → Close
```

---

## 13. Enter Behaviour

Enter is contextual.

No `Ctrl+Enter` behaviour is required.

```txt
Project row:
  Enter selects project and moves to next useful section

Workspace row:
  Enter selects workspace and moves to next useful section

Module row:
  Enter opens or attaches module session

Action row:
  Enter runs action or opens action form
```

### Project Row

If selected project has workspaces and no selected workspace:

```txt
Enter → Workspaces section
```

If selected project has modules and only default workspace:

```txt
Enter → Modules section
```

If selected project has no modules and no workspaces:

```txt
Enter → open/attach project root session
```

### Workspace Row

If selected project has modules:

```txt
Enter → select workspace, then show Modules section
```

If selected project has no modules:

```txt
Enter → open/attach workspace root session
```

### Module Row

```txt
Enter → open/attach module session
```

If no session exists, create one.

---

## 14. Actions Menu

There should be a Raycast-style actions menu/popover.

Open with:

```txt
? or Ctrl+A
```

The actions menu applies to:

- The selected row, if one exists
- Otherwise the current context

Actions should be contextual.

### Project Actions

Available when a project is selected or in project context:

```txt
Open project root
Create worktree
Sync project
Show overview
Favourite project
Archive project
```

Future:

```txt
Start remote worker
Open planning workflow
Run project checks
```

### Workspace Actions

Available when a workspace is selected or in workspace context:

```txt
Open workspace root
Create session
Create worktree
Rebase workspace
Sync workspace
Delete/remove worktree
Show git status
```

Important:

> Create worktree must be available anywhere inside a project context, even when currently viewing a workspace or module.

For example, all of these should support `Create worktree`:

```txt
harbr
harbr › feature/auth-flow
harbr › feature/auth-flow › packages/db
```

The action resolves upward to the current project.

### Module Actions

Available when a module is selected or in module context:

```txt
Open/attach session
Create session
Open module path
Show git status for module path
Run checks
Start local agent
Start remote worker
```

Future:

```txt
Open task queue
Create task
Assign remote worker
```

---

## 15. Create Worktree Flow

Create worktree is an action, not a normal list row in Active mode.

It should be available from project/workspace/module context.

Flow:

```txt
Actions → Create worktree
```

Then show a small form/prompt:

```txt
Create worktree

Project: harbr
Base: main
Branch: feature/auth-flow
Name/path: feature-auth-flow
```

MVP can simplify to:

```txt
Branch name:
> feature/auth-flow
```

After creation:

1. Create git worktree
2. Persist workspace in Harbr state/db if needed
3. Select the new workspace as sticky context
4. Move to the next useful section

If project has modules:

```txt
after create → Modules section inside new workspace
```

If project has no modules:

```txt
after create → open/attach workspace root session
```

---

## 16. Flow Permutations

### A. Standard repo, no workspaces, no modules

Example:

```txt
Project: notes-api
Workspaces: default only
Modules: none
```

Default section:

```txt
Projects
```

User flow:

```txt
Open Harbr
Type "notes"
Enter
```

Result:

```txt
Open/attach project root session
```

Display:

```txt
Projects · Active/All
> notes

○ notes-api      project
```

### B. Standard repo, workspaces, no modules

Example:

```txt
Project: notes-api
Workspaces:
  main
  feature/auth
  fix/cache
Modules: none
```

Default section after project selected:

```txt
Workspaces
```

User flow:

```txt
Open Harbr
Type "auth"
Enter
```

If project is already sticky:

```txt
notes-api        Workspaces · Active/All
> auth

○ feature/auth     workspace
```

Result:

```txt
Open/attach workspace root session
```

To change project:

```txt
Back to Projects
Select project
Then select workspace
```

### C. Monorepo, no extra workspaces

Example:

```txt
Project: harbr
Workspaces: default only
Modules:
  apps/tui
  packages/git
  packages/scanner
```

Default section:

```txt
Modules
```

Display:

```txt
harbr        Modules · Active/All
> git

○ packages/git      module
```

User flow:

```txt
Open Harbr
Type "git"
Enter
```

Result:

```txt
Open/attach session at:
harbr/packages/git
```

The default workspace is implicit and skipped visually.

### D. Monorepo with workspaces, workspace already selected

Example:

```txt
Project: harbr
Selected workspace: feature/auth-flow
Modules:
  apps/tui
  packages/git
  packages/scanner
```

Default section:

```txt
Modules
```

Display:

```txt
harbr › feature/auth-flow        Modules · Active/All
> scanner

○ packages/scanner      module
```

User flow:

```txt
Open Harbr
Type "scanner"
Enter
```

Result:

```txt
Open/attach session at:
harbr-worktrees/feature-auth-flow/packages/scanner
```

### E. Monorepo with workspaces, no workspace selected

Example:

```txt
Project: harbr
Workspaces:
  main
  feature/auth-flow
  fix/db-sync
Modules:
  apps/tui
  packages/git
  packages/scanner
```

Default section:

```txt
Workspaces
```

Display:

```txt
harbr        Workspaces · Active/All
> auth

○ feature/auth-flow      workspace
```

User flow:

```txt
Open Harbr
Type "auth"
Enter
```

Result:

```txt
Select workspace
Move to Modules section
```

Then:

```txt
Type "scanner"
Enter
```

Result:

```txt
Open/attach module session inside selected workspace
```

---

## 17. Active / All Examples

### Project List

```txt
Projects · Active
```

Rows:

```txt
● harbr       project      4 sessions
● notes-api     project      1 session
```

Toggle All:

```txt
Projects · All
```

Rows:

```txt
● harbr       project      4 sessions
● notes-api     project      1 session
○ website       project      no sessions
○ cli-tools     project      no sessions
```

### Workspace List

```txt
harbr        Workspaces · Active
```

Rows:

```txt
● feature/auth-flow      workspace      2 sessions
● main                   workspace      1 session
```

Toggle All:

```txt
harbr        Workspaces · All
```

Rows:

```txt
● feature/auth-flow      workspace      2 sessions
● main                   workspace      1 session
○ fix/db-sync            workspace      no sessions
○ docs/planning          workspace      no sessions
```

### Module List

```txt
harbr › feature/auth-flow        Modules · Active
```

Rows:

```txt
● apps/web          module      session
● packages/db       module      session
```

Toggle All:

```txt
harbr › feature/auth-flow        Modules · All
```

Rows:

```txt
● apps/web          module      session
● packages/db       module      session
○ packages/git      module      no session
○ packages/config   module      no session
○ packages/scanner  module      no session
```

---

## 18. Empty States

Avoid dead ends.

### Active mode has no results

If there are no active items in the current section, automatically show All.

Optionally display a hint:

```txt
No active modules. Showing all modules.
```

### No modules

If a project has no modules:

- Do not show an empty Modules section
- Use Workspaces section if multiple workspaces exist
- Otherwise use Projects/project root behaviour

### No workspaces beyond default

If a project only has the default workspace:

- Do not show Workspaces section unless explicitly needed for debugging/config
- Go directly to Modules if modules exist
- Otherwise open project root

---

## 19. Suggested View Model

```ts
type View =
  | {
      type: 'projects'
      visibility: VisibilityFilter
      query: string
    }
  | {
      type: 'workspaces'
      projectId: ProjectId
      visibility: VisibilityFilter
      query: string
    }
  | {
      type: 'modules'
      projectId: ProjectId
      workspaceId: WorkspaceId
      visibility: VisibilityFilter
      query: string
    }
  | {
      type: 'actions'
      target: EntityRef
      query: string
    }
```

Entity refs:

```ts
type EntityRef =
  | { type: 'project'; projectId: ProjectId }
  | { type: 'workspace'; projectId: ProjectId; workspaceId: WorkspaceId }
  | {
      type: 'module'
      projectId: ProjectId
      workspaceId: WorkspaceId
      moduleId: ModuleId
    }
```

Rows:

```ts
type Row = ProjectRow | WorkspaceRow | ModuleRow | ActionRow

type BaseRow = {
  id: string
  label: string
  kind: 'project' | 'workspace' | 'module' | 'action'
  isActive: boolean
  metadata?: string
}

type ProjectRow = BaseRow & {
  kind: 'project'
  projectId: ProjectId
  activeSessionCount: number
}

type WorkspaceRow = BaseRow & {
  kind: 'workspace'
  projectId: ProjectId
  workspaceId: WorkspaceId
  activeSessionCount: number
}

type ModuleRow = BaseRow & {
  kind: 'module'
  projectId: ProjectId
  workspaceId: WorkspaceId
  moduleId: ModuleId
  hasSession: boolean
}

type ActionRow = BaseRow & {
  kind: 'action'
  actionId: string
  target: EntityRef
}
```

---

## 20. List Computation

The UI should compute rows in this order:

```ts
const baseItems = getItemsForSection(view, sourceOfTruth)
const visibleItems = applyVisibilityFilter(baseItems, view.visibility)
const filteredItems = fuzzyFilter(visibleItems, view.query)
const rankedItems = rankItems(filteredItems, view.query)
```

Where:

```ts
function applyVisibilityFilter(items, visibility) {
  if (visibility === 'all') return items
  return items.filter((item) => item.isActive)
}
```

If Active produces zero items:

```ts
if (visibility === 'active' && activeItems.length === 0) {
  visibility = 'all'
}
```

---

## 21. Session Awareness

The scanner/reconciler should provide enough data for the UI to know:

- Does this project have active descendant sessions?
- Does this workspace have active descendant sessions?
- Does this module have an active session?
- What path/session should be opened on Enter?

The UI should not discover tmux state directly. It should consume normalized state from the application layer.

Example normalized shape:

```ts
type ProjectSummary = {
  id: ProjectId
  name: string
  rootPath: string
  activeSessionCount: number
}

type WorkspaceSummary = {
  id: WorkspaceId
  projectId: ProjectId
  name: string
  path: string
  kind: 'default' | 'worktree'
  activeSessionCount: number
}

type ModuleSummary = {
  id: ModuleId
  projectId: ProjectId
  workspaceId: WorkspaceId
  name: string
  relativePath: string
  absolutePath: string
  hasActiveSession: boolean
}
```

---

## 22. MVP Behaviour

The first implementation should support:

### Sections

- Projects
- Workspaces
- Modules
- Actions

### Filters

- Active
- All

### Navigation

- Up/down
- Fuzzy filter current list
- Enter contextual select/open
- Back
- Toggle Active/All
- Actions menu

### Actions

- Open project root
- Open workspace root
- Open/attach module session
- Create worktree

### State

- Remember last selected project
- Remember last selected workspace per project
- Remember last selected module per workspace if useful

### Rendering

- Breadcrumbs
- Section name
- Active/All mode
- Row status indicator
- Row kind
- Session count/session state

---

## 23. Non-MVP / Later

Do not build these first unless needed:

- Global omnibox across all entities
- Favourites
- Remote workers
- Project overview pages
- Task queues
- Agent run history
- Rich preview panes
- Multi-column layouts
- Custom user keymaps
- Workspace deletion/rebase flows
- Module creation/config editing

The current model does not require a global omnibox. The drillable list and sticky context should be enough initially.

---

## 24. Product Principles

1. **Resume first**
   - Active mode should make it easy to return to running sessions.

2. **Create second**
   - All mode and actions menu expose inactive targets and creation flows.

3. **Project/workspace/module context should be visible**
   - Breadcrumbs must always show where the user is.

4. **Typing filters the current section**
   - Avoid surprising jumps between hierarchy levels.

5. **Enter should do the obvious thing**
   - Select/drill until a leaf is reached.
   - Open/attach at the leaf.

6. **Actions are explicit**
   - Root opens, worktree creation, and future advanced operations live in the actions menu.

7. **Skip empty layers**
   - Do not force workspace selection when only the default workspace exists.
   - Do not show modules for projects without modules.

8. **Sticky context makes repeated use fast**
   - Opening Harbr should usually show the list the user is most likely to need next.

---

## 25. Example Final UX

### Resume active module

```txt
Open Harbr

harbr › feature/auth-flow        Modules · Active
> db

● packages/db      module      session

Enter
```

Result:

```txt
Attach to packages/db session
```

### Open inactive module

```txt
Open Harbr

harbr › feature/auth-flow        Modules · Active
> git

No active matches
```

Press Tab:

```txt
harbr › feature/auth-flow        Modules · All
> git

○ packages/git     module      no session

Enter
```

Result:

```txt
Create/attach session for packages/git
```

### Change workspace then open module

```txt
Open Harbr
Back or shortcut to Workspaces

harbr        Workspaces · Active
> auth

● feature/auth-flow      workspace      2 sessions

Enter
```

Now:

```txt
harbr › feature/auth-flow        Modules · Active
> web

● apps/web      module      session

Enter
```

Result:

```txt
Attach to apps/web session in feature/auth-flow workspace
```

### Create worktree from module context

```txt
harbr › feature/auth-flow › packages/db
? / Ctrl+A
```

Actions:

```txt
Open module session
Open workspace root
Open project root
Create worktree
Show git status
```

Select:

```txt
Create worktree
```

Prompt:

```txt
Create worktree for harbr

Branch:
> feature/new-sync
```

After creation:

```txt
harbr › feature/new-sync        Modules · All
```

---

## 26. Implementation Summary

Build the interface as:

```txt
tmux popup
  drillable fuzzy list
  scoped sections
  sticky context
  active/all visibility
  contextual actions menu
```

Do not build it as a generic command palette first.

The central loop is:

```txt
Render current section
Filter rows by query
Move selection
Enter selects/drills/opens
Actions menu handles non-default operations
Persist context
```

This should be enough for an agent to implement the first Harbr popover UI.
