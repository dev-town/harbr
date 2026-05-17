import { createCliRenderer } from '@opentui/core'
import { ProjectService, makeProjectServiceLayer } from '@harbour/db'
import {
  harbourCommandIds,
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
  projectRowsAtom,
  queryAtom,
  selectedIndexAtom,
  selectedProjectIdAtom,
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
        placeholder={currentSection === 'workspaces' ? 'Filter workspaces' : 'Filter projects'}
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
  store.set(projectRowsAtom, summaries.map(mapProjectSummaryToRow))
  store.set(workspaceRowsAtom, [])
  store.set(currentSectionAtom, 'projects')
  store.set(selectedProjectIdAtom, null)
  store.set(selectedIndexAtom, 0)
  store.set(loadingAtom, false)
  store.set(
    noticeAtom,
    summaries.length === 0 ? 'No projects yet. Check config or run sync.' : null,
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

  if (query.length > 0) {
    store.set(queryAtom, '')
    store.set(selectedIndexAtom, 0)
    store.set(noticeAtom, null)
    return
  }

  if (store.get(currentSectionAtom) === 'workspaces') {
    store.set(currentSectionAtom, 'projects')
    store.set(workspaceRowsAtom, [])
    store.set(selectedProjectIdAtom, null)
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
      store.set(noticeAtom, `${row.label}: modules view next`)
      return
    }

    store.set(noticeAtom, `${row.label}: open workspace root next`)
    return
  }

  if (row.kind !== 'project') {
    return
  }

  if (row.hasWorkspaces) {
    void openWorkspaces(row.projectId)
    return
  }

  if (row.hasModules) {
    store.set(noticeAtom, `${row.label}: modules view next`)
    return
  }

  store.set(noticeAtom, `${row.label}: open project root next`)
}

async function openWorkspaces(projectId: string) {
  store.set(loadingAtom, true)
  store.set(noticeAtom, null)

  try {
    const summaries = await listWorkspaceSummaries(projectId, options.dbPath)
    store.set(workspaceRowsAtom, summaries.map(mapWorkspaceSummaryToRow))
    store.set(selectedProjectIdAtom, projectId)
    store.set(currentSectionAtom, 'workspaces')
    store.set(selectedIndexAtom, 0)
    store.set(queryAtom, '')
  } catch (error) {
    store.set(noticeAtom, formatError(error))
  } finally {
    store.set(loadingAtom, false)
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
