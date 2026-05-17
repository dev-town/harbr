import { createCliRenderer } from '@opentui/core'
import { ProjectService, makeProjectServiceLayer } from '@harbour/db'
import {
  type HarbourContext,
  harbourCommandIds,
  type ModuleRow,
  type ModuleSummary,
  type ProjectRow,
  type ProjectSummary,
  type WorkspaceRow,
  type WorkspaceSummary,
} from '@harbour/domain'
import { makeBrowseKeymap } from '@harbour/keymap'
import { sync } from '@harbour/reconciler'
import { HarbourPopover } from '@harbour/ui'
import { KeymapProvider } from '@opentui/keymap/react'
import { createRoot } from '@opentui/react'
import { Effect, Either } from 'effect'
import { Provider, createStore, useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'

import {
  breadcrumbAtom,
  currentSectionAtom,
  effectiveVisibilityAtom,
  footerAtom,
  loadingAtom,
  noticeAtom,
  moduleRowsAtom,
  projectRowsAtom,
  queryAtom,
  selectedIndexAtom,
  selectedProjectIdAtom,
  selectedWorkspaceIdAtom,
  visibilityAtom,
  workspaceRowsAtom,
  visibleRowsAtom,
} from './state'

type TuiOptions = {
  configPath?: string
  dbPath?: string
}

const args = process.argv.slice(2)
const configPath = readArgValue(args, '--path')
const dbPath = readArgValue(args, '--db-path')

const store = createStore()

const options: TuiOptions = {
  configPath,
  dbPath,
}

const renderer = await createCliRenderer({
  clearOnShutdown: false,
  exitOnCtrlC: false,
})

const keymap = makeBrowseKeymap(renderer, {
  onCommand: (commandId) => {
    switch (commandId) {
      case harbourCommandIds.appQuit:
        renderer.destroy()
        return
      case harbourCommandIds.browseUp:
        moveSelection(-1)
        return
      case harbourCommandIds.browseDown:
        moveSelection(1)
        return
      case harbourCommandIds.browseToggleVisibility:
        toggleVisibility()
        return
      case harbourCommandIds.browseRefresh:
        void loadProjects(options)
        return
      case harbourCommandIds.browseBack:
        handleEscape()
        return
      case harbourCommandIds.browseSelect:
        handleSelect()
        return
      case harbourCommandIds.browseOpenActions:
        store.set(noticeAtom, 'Actions menu next')
        return
    }
  },
})

createRoot(renderer).render(
  <Provider store={store}>
    <KeymapProvider keymap={keymap}>
      <App options={options} />
    </KeymapProvider>
  </Provider>,
)

function App({ options }: { options: TuiOptions }) {
  const breadcrumb = useAtomValue(breadcrumbAtom)
  const currentSection = useAtomValue(currentSectionAtom)
  const footer = useAtomValue(footerAtom)
  const isLoading = useAtomValue(loadingAtom)
  const notice = useAtomValue(noticeAtom)
  const query = useAtomValue(queryAtom)
  const selectedIndex = useAtomValue(selectedIndexAtom)
  const visibility = useAtomValue(effectiveVisibilityAtom)
  const rows = useAtomValue(visibleRowsAtom)
  const setQuery = useSetAtom(queryAtom)
  const setSelectedIndex = useSetAtom(selectedIndexAtom)

  useEffect(() => {
    void loadProjects(options)
  }, [options])

  useEffect(() => {
    setSelectedIndex((current) => clampIndex(current, rows.length))
  }, [rows.length, setSelectedIndex])

  return (
    <box flexDirection="column" height="100%" padding={1} width="100%">
      <input
        focused
        onInput={(value) => {
          setQuery(value)
          setSelectedIndex(0)
          store.set(noticeAtom, null)
        }}
        onSubmit={() => {
          handleSelect()
        }}
        placeholder={getPlaceholder(currentSection)}
        value={query}
      />
      <box flexGrow={1} marginTop={1}>
        <HarbourPopover
          breadcrumb={breadcrumb}
          footer={footer}
          isLoading={isLoading}
          notice={notice}
          query={query}
          rows={rows}
          sectionLabel={capitalize(currentSection)}
          selectedIndex={selectedIndex}
          visibility={visibility}
        />
      </box>
    </box>
  )
}

async function loadProjects(options: TuiOptions) {
  store.set(loadingAtom, true)
  store.set(noticeAtom, null)

  const syncResult = await Effect.runPromise(Effect.either(sync(options)))

  if (Either.isLeft(syncResult)) {
    store.set(projectRowsAtom, [])
    store.set(noticeAtom, formatError(syncResult.left))
    store.set(loadingAtom, false)
    return
  }

  const summaries = await listProjectSummaries(options.dbPath)
  const context = await loadUiContext(options.dbPath)
  store.set(projectRowsAtom, summaries.map(mapProjectSummaryToRow))
  store.set(moduleRowsAtom, [])
  store.set(workspaceRowsAtom, [])
  store.set(currentSectionAtom, 'projects')
  store.set(selectedProjectIdAtom, null)
  store.set(selectedWorkspaceIdAtom, null)
  store.set(selectedIndexAtom, 0)
  store.set(loadingAtom, false)
  await restoreUiContext(context, summaries)
  store.set(
    noticeAtom,
    summaries.length === 0 ? 'No projects yet. Check config or run sync.' : null,
  )
}

async function loadUiContext(dbPath?: string) {
  return Effect.runPromise(
    Effect.flatMap(ProjectService, (service) => service.loadUiContext).pipe(
      Effect.provide(makeProjectServiceLayer(dbPath)),
    ),
  )
}

async function listProjectSummaries(dbPath?: string) {
  return Effect.runPromise(
    Effect.flatMap(ProjectService, (service) => service.listProjectSummaries).pipe(
      Effect.provide(makeProjectServiceLayer(dbPath)),
    ),
  )
}

async function listWorkspaceSummaries(projectId: string, dbPath?: string) {
  return Effect.runPromise(
    Effect.flatMap(ProjectService, (service) => service.listWorkspaceSummaries(projectId)).pipe(
      Effect.provide(makeProjectServiceLayer(dbPath)),
    ),
  )
}

async function listModuleSummaries(workspaceId: string, dbPath?: string) {
  return Effect.runPromise(
    Effect.flatMap(ProjectService, (service) => service.listModuleSummaries(workspaceId)).pipe(
      Effect.provide(makeProjectServiceLayer(dbPath)),
    ),
  )
}

async function saveUiContext(context: HarbourContext, dbPath?: string) {
  return Effect.runPromise(
    Effect.flatMap(ProjectService, (service) => service.saveUiContext(context)).pipe(
      Effect.provide(makeProjectServiceLayer(dbPath)),
    ),
  )
}

function moveSelection(delta: number) {
  const nextIndex = store.get(selectedIndexAtom) + delta
  store.set(selectedIndexAtom, clampIndex(nextIndex, store.get(visibleRowsAtom).length))
  store.set(noticeAtom, null)
}

function toggleVisibility() {
  store.set(visibilityAtom, (current) => (current === 'active' ? 'all' : 'active'))
  store.set(selectedIndexAtom, 0)
  store.set(noticeAtom, null)
}

function handleEscape() {
  const query = store.get(queryAtom)
  const selectedProjectId = store.get(selectedProjectIdAtom)
  const selectedWorkspaceId = store.get(selectedWorkspaceIdAtom)

  if (query.length > 0) {
    store.set(queryAtom, '')
    store.set(selectedIndexAtom, 0)
    store.set(noticeAtom, null)
    return
  }

  if (store.get(currentSectionAtom) === 'workspaces') {
    void persistContext({
      projectId: selectedProjectId ?? undefined,
    })
    store.set(currentSectionAtom, 'projects')
    store.set(moduleRowsAtom, [])
    store.set(workspaceRowsAtom, [])
    store.set(selectedProjectIdAtom, null)
    store.set(selectedWorkspaceIdAtom, null)
    store.set(selectedIndexAtom, 0)
    store.set(noticeAtom, null)
    return
  }

  if (store.get(currentSectionAtom) === 'modules') {
    void persistContext({
      projectId: selectedProjectId ?? undefined,
      workspaceId: selectedWorkspaceId ?? undefined,
    })
    store.set(currentSectionAtom, 'workspaces')
    store.set(moduleRowsAtom, [])
    store.set(selectedWorkspaceIdAtom, null)
    store.set(selectedIndexAtom, 0)
    store.set(noticeAtom, null)
    return
  }

  renderer.destroy()
}

function handleSelect() {
  const row = store.get(visibleRowsAtom)[store.get(selectedIndexAtom)]

  if (!row) {
    return
  }

  if (row.kind === 'workspace') {
    if (row.hasModules) {
      void openModules(row.projectId, row.workspaceId)
      return
    }

    void persistContext({
      projectId: row.projectId,
      workspaceId: row.workspaceId,
    })
    store.set(noticeAtom, `${row.label}: open workspace root next`)
    return
  }

  if (row.kind !== 'project') {
    if (row.kind === 'module') {
      void persistContext({
        projectId: row.projectId,
        workspaceId: row.workspaceId,
        moduleId: row.moduleId,
      })
      // TODO: replace this notice with runtime attach/create once write-side tmux flow exists.
      store.set(noticeAtom, `${row.label}: attach/create module session next`)
    }

    return
  }

  if (row.hasWorkspaces) {
    void openWorkspaces(row.projectId)
    return
  }

  if (row.hasModules) {
    void openDefaultWorkspaceModules(row.projectId)
    return
  }

  void persistContext({ projectId: row.projectId })
  // TODO: replace this notice with project-root attach/create once runtime actions exist.
  store.set(noticeAtom, `${row.label}: open project root next`)
}

async function openWorkspaces(projectId: string) {
  store.set(loadingAtom, true)
  store.set(noticeAtom, null)

  try {
    const summaries = await listWorkspaceSummaries(projectId, options.dbPath)
    store.set(moduleRowsAtom, [])
    store.set(workspaceRowsAtom, summaries.map(mapWorkspaceSummaryToRow))
    store.set(selectedProjectIdAtom, projectId)
    store.set(selectedWorkspaceIdAtom, null)
    store.set(currentSectionAtom, 'workspaces')
    store.set(selectedIndexAtom, 0)
    store.set(queryAtom, '')
    await persistContext({ projectId })
  } catch (error) {
    store.set(noticeAtom, formatError(error))
  } finally {
    store.set(loadingAtom, false)
  }
}

async function openModules(projectId: string, workspaceId: string) {
  store.set(loadingAtom, true)
  store.set(noticeAtom, null)

  try {
    const summaries = await listModuleSummaries(workspaceId, options.dbPath)
    store.set(moduleRowsAtom, summaries.map(mapModuleSummaryToRow))
    store.set(selectedProjectIdAtom, projectId)
    store.set(selectedWorkspaceIdAtom, workspaceId)
    store.set(currentSectionAtom, 'modules')
    store.set(selectedIndexAtom, 0)
    store.set(queryAtom, '')
    await persistContext({ projectId, workspaceId })
  } catch (error) {
    store.set(noticeAtom, formatError(error))
  } finally {
    store.set(loadingAtom, false)
  }
}

async function openDefaultWorkspaceModules(projectId: string) {
  const summaries = await listWorkspaceSummaries(projectId, options.dbPath)
  const defaultWorkspace = summaries.find((workspace) => workspace.isDefault)

  if (!defaultWorkspace) {
    // TODO: surface a clearer empty-state when project module config exists but no default workspace was persisted.
    store.set(noticeAtom, 'No default workspace found')
    return
  }

  await openModules(projectId, defaultWorkspace.id)
}

async function restoreUiContext(
  context: HarbourContext,
  projects: readonly ProjectSummary[],
) {
  const project = context.projectId
    ? projects.find((candidate) => candidate.id === context.projectId)
    : undefined

  if (!project) {
    return
  }

  const projectIndex = projects.findIndex((candidate) => candidate.id === project.id)
  store.set(selectedIndexAtom, clampIndex(projectIndex, projects.length))

  if (context.workspaceId && project.hasModules) {
    // TODO: prefer workspaces view instead when sticky context points at a project that no longer has module config.
    await openModules(project.id, context.workspaceId)

    if (context.moduleId) {
      const moduleRows = store.get(moduleRowsAtom)
      const moduleIndex = moduleRows.findIndex((row) => row.moduleId === context.moduleId)

      if (moduleIndex >= 0) {
        store.set(selectedIndexAtom, moduleIndex)
      }
    }

    return
  }

  if (project.hasWorkspaces) {
    await openWorkspaces(project.id)

    if (context.workspaceId) {
      const workspaceRows = store.get(workspaceRowsAtom)
      const workspaceIndex = workspaceRows.findIndex(
        (row) => row.workspaceId === context.workspaceId,
      )

      if (workspaceIndex >= 0) {
        store.set(selectedIndexAtom, workspaceIndex)
      }
    }

    return
  }

  if (project.hasModules) {
    await openDefaultWorkspaceModules(project.id)
  }
}

async function persistContext(context: HarbourContext) {
  try {
    await saveUiContext(context, options.dbPath)
  } catch {
    // TODO: route persistence failures through observability once that package is wired into the TUI.
  }
}

function mapProjectSummaryToRow(summary: ProjectSummary): ProjectRow {
  return {
    id: summary.id,
    kind: 'project',
    label: summary.name,
    projectId: summary.id,
    isActive: summary.activeSessionCount > 0,
    metadata: formatSessionMetadata(summary.activeSessionCount),
    activeSessionCount: summary.activeSessionCount,
    hasModules: summary.hasModules,
    hasWorkspaces: summary.hasWorkspaces,
  }
}

function mapWorkspaceSummaryToRow(summary: WorkspaceSummary): WorkspaceRow {
  return {
    id: summary.id,
    kind: 'workspace',
    label: summary.name,
    projectId: summary.projectId,
    workspaceId: summary.id,
    isActive: summary.activeSessionCount > 0,
    metadata: formatSessionMetadata(summary.activeSessionCount),
    activeSessionCount: summary.activeSessionCount,
    hasModules: summary.hasModules,
    isDefault: summary.isDefault,
  }
}

function mapModuleSummaryToRow(summary: ModuleSummary): ModuleRow {
  return {
    id: summary.id,
    kind: 'module',
    label: summary.name,
    projectId: summary.projectId,
    workspaceId: summary.workspaceId,
    moduleId: summary.id,
    isActive: summary.hasActiveSession,
    metadata: summary.hasActiveSession ? 'session' : 'no session',
    hasSession: summary.hasActiveSession,
  }
}

function formatSessionMetadata(activeSessionCount: number) {
  if (activeSessionCount === 0) {
    return 'no sessions'
  }

  if (activeSessionCount === 1) {
    return '1 session'
  }

  return `${activeSessionCount} sessions`
}

function clampIndex(index: number, rowCount: number) {
  if (rowCount === 0) {
    return 0
  }

  return Math.max(0, Math.min(index, rowCount - 1))
}

function capitalize(value: string) {
  return value[0]?.toUpperCase() + value.slice(1)
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function readArgValue(args: string[], flag: string) {
  const flagIndex = args.indexOf(flag)
  return flagIndex >= 0 ? args[flagIndex + 1] : undefined
}

function getPlaceholder(currentSection: string) {
  if (currentSection === 'modules') {
    return 'Filter modules'
  }

  if (currentSection === 'workspaces') {
    return 'Filter workspaces'
  }

  return 'Filter projects'
}
