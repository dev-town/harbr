import type { CurrentRuntime, RuntimePathObservation, RuntimeSource } from '@harbr/domain'

export type HerdrWorkspace = {
  readonly focused?: boolean
  readonly label: string
  readonly workspace_id: string
  readonly worktree?: { readonly checkout_path?: string } | null
}

export type HerdrPane = {
  readonly cwd?: string | null
  readonly focused?: boolean
  readonly foreground_cwd?: string | null
  readonly label?: string | null
  readonly pane_id?: string
  readonly tab_id?: string
  readonly workspace_id: string
}

export type HerdrTab = {
  readonly label: string
  readonly tab_id: string
  readonly workspace_id: string
}

export type HerdrSessionSnapshot = {
  readonly focused_workspace_id?: string | null
  readonly panes: readonly HerdrPane[]
  readonly tabs: readonly HerdrTab[]
  readonly workspaces: readonly HerdrWorkspace[]
}

export type NormalizedHerdrSnapshot = {
  readonly currentRuntime: CurrentRuntime
  readonly runtimes: RuntimePathObservation[]
}

export function normalizeHerdrSnapshot(
  input: unknown,
  source: RuntimeSource,
  launchWorkspaceId?: string,
): NormalizedHerdrSnapshot {
  const snapshot = readHerdrSessionSnapshot(input)
  const runtimes = snapshot.workspaces.flatMap((workspace) => {
    const contextPath = findWorkspacePath(snapshot.panes, workspace)

    return contextPath
      ? [
          {
            contextPath,
            identity: {
              displayLabel: workspace.label,
              externalId: workspace.workspace_id,
              source,
            },
            status: 'open' as const,
          },
        ]
      : []
  })
  const focusedWorkspaceId = launchWorkspaceId || snapshot.focused_workspace_id || undefined
  const current = focusedWorkspaceId
    ? runtimes.find((runtime) => runtime.identity.externalId === focusedWorkspaceId)
    : undefined

  return {
    currentRuntime: current ? { identity: current.identity, status: current.status } : null,
    runtimes,
  }
}

export function readHerdrSessionSnapshot(input: unknown): HerdrSessionSnapshot {
  if (!isRecord(input)) {
    throw new Error('Herdr snapshot response is not an object')
  }

  const result = isRecord(input.result) ? input.result : input
  const snapshot =
    result.type === 'session_snapshot' && isRecord(result.snapshot) ? result.snapshot : result

  if (!Array.isArray(snapshot.workspaces) || !Array.isArray(snapshot.panes)) {
    throw new Error('Herdr snapshot is missing workspaces or panes')
  }

  const workspaces = snapshot.workspaces.map(readWorkspace)
  const panes = snapshot.panes.map(readPane)
  const tabs = Array.isArray(snapshot.tabs) ? snapshot.tabs.map(readTab) : []

  return {
    focused_workspace_id:
      typeof snapshot.focused_workspace_id === 'string' ? snapshot.focused_workspace_id : null,
    panes,
    tabs,
    workspaces,
  }
}

function readWorkspace(input: unknown): HerdrWorkspace {
  if (
    !isRecord(input) ||
    typeof input.workspace_id !== 'string' ||
    typeof input.label !== 'string'
  ) {
    throw new Error('Herdr snapshot contains an invalid workspace')
  }

  const worktree = isRecord(input.worktree)
    ? typeof input.worktree.checkout_path === 'string'
      ? { checkout_path: input.worktree.checkout_path }
      : {}
    : null

  return {
    focused: input.focused === true,
    label: input.label,
    workspace_id: input.workspace_id,
    worktree,
  }
}

function readPane(input: unknown): HerdrPane {
  if (!isRecord(input) || typeof input.workspace_id !== 'string') {
    throw new Error('Herdr snapshot contains an invalid pane')
  }

  return {
    cwd: typeof input.cwd === 'string' ? input.cwd : null,
    focused: input.focused === true,
    foreground_cwd: typeof input.foreground_cwd === 'string' ? input.foreground_cwd : null,
    label: typeof input.label === 'string' ? input.label : null,
    ...(typeof input.pane_id === 'string' ? { pane_id: input.pane_id } : {}),
    ...(typeof input.tab_id === 'string' ? { tab_id: input.tab_id } : {}),
    workspace_id: input.workspace_id,
  }
}

function readTab(input: unknown): HerdrTab {
  if (
    !isRecord(input) ||
    typeof input.tab_id !== 'string' ||
    typeof input.workspace_id !== 'string' ||
    typeof input.label !== 'string'
  ) {
    throw new Error('Herdr snapshot contains an invalid tab')
  }

  return {
    label: input.label,
    tab_id: input.tab_id,
    workspace_id: input.workspace_id,
  }
}

function findWorkspacePath(panes: readonly HerdrPane[], workspace: HerdrWorkspace) {
  const checkoutPath = workspace.worktree?.checkout_path?.trim()

  if (checkoutPath) {
    return checkoutPath
  }

  const workspacePanes = panes.filter((pane) => pane.workspace_id === workspace.workspace_id)
  const pane = workspacePanes.find((candidate) => candidate.focused) ?? workspacePanes[0]

  return pane?.cwd?.trim() || pane?.foreground_cwd?.trim() || null
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null
}
