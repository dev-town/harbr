import type { HarbourRow } from '@harbour/domain'
import { atom } from 'jotai'

import { currentSectionAtom, selectedProjectIdAtom, selectedWorkspaceIdAtom, selectedWorkspaceImplicitAtom } from './navigation'
import { actionsOpenAtom, visibilityAtom, queryAtom } from './app'
import { actionRowsAtom, moduleRowsAtom, projectRowsAtom, workspaceRowsAtom } from './rows'

export const browseRowsAtom = atom<readonly HarbourRow[]>((get) => {
  const currentSection = get(currentSectionAtom)

  if (currentSection === 'modules') {
    return get(moduleRowsAtom)
  }

  if (currentSection === 'workspaces') {
    return get(workspaceRowsAtom)
  }

  return get(projectRowsAtom)
})

export const visibleBrowseRowsAtom = atom<readonly HarbourRow[]>((get) => {
  const visibility = get(visibilityAtom)
  const query = get(queryAtom).trim().toLowerCase()
  const baseRows = get(browseRowsAtom)
  const scopedRows = visibility === 'active' ? baseRows.filter((row) => row.isActive) : [...baseRows]

  if (!query) {
    return scopedRows
  }

  return scopedRows
    .map((row) => ({ row, score: getRowScore(row, query) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => left.score - right.score)
    .map((entry) => entry.row)
})

export const currentRowsAtom = atom<readonly HarbourRow[]>((get) =>
  get(actionsOpenAtom) ? get(actionRowsAtom) : get(visibleBrowseRowsAtom),
)

export const effectiveVisibilityAtom = atom((get) => {
  if (get(actionsOpenAtom)) {
    return 'all'
  }

  const visibility = get(visibilityAtom)
  const rows = get(browseRowsAtom)

  if (visibility === 'all') {
    return visibility
  }

  return rows.some((row) => row.isActive) ? 'active' : 'all'
})

export const footerHintsAtom = atom((get) => {
  const query = get(queryAtom)
  const currentSection = get(currentSectionAtom)

  if (get(actionsOpenAtom)) {
    return [
      { key: '↑↓', label: 'move' },
      { key: 'Enter', label: 'run action' },
      { key: 'Esc', label: 'close' },
    ]
  }

  if (query.length > 0) {
    return [
      { key: 'Enter', label: 'drill next' },
      { key: 'Tab', label: 'active/all' },
      { key: 'Esc', label: 'clear query' },
    ]
  }

  if (currentSection === 'workspaces') {
    return [
      { key: 'Enter', label: 'drill next' },
      { key: 'Tab', label: 'active/all' },
      { key: 'Ctrl+R', label: 'refresh' },
      { key: 'Esc', label: 'back' },
    ]
  }

  if (currentSection === 'modules') {
    return [
      { key: 'Enter', label: 'attach/create' },
      { key: 'Tab', label: 'active/all' },
      { key: 'Ctrl+R', label: 'refresh' },
      { key: 'Esc', label: 'back' },
    ]
  }

  return [
    { key: 'Enter', label: 'drill next' },
    { key: 'Tab', label: 'active/all' },
    { key: 'Ctrl+R', label: 'refresh' },
    { key: 'Esc', label: 'close' },
  ]
})

export const breadcrumbAtom = atom((get) => {
  const selectedProjectId = get(selectedProjectIdAtom)
  const selectedWorkspaceId = get(selectedWorkspaceIdAtom)
  const selectedWorkspaceImplicit = get(selectedWorkspaceImplicitAtom)
  const currentSection = get(currentSectionAtom)
  const projectRows = get(projectRowsAtom)
  const projectLabel = projectRows.find((row) => row.projectId === selectedProjectId)?.label
  const workspaceLabel = get(workspaceRowsAtom).find((row) => row.workspaceId === selectedWorkspaceId)?.label

  if (
    currentSection === 'modules' &&
    projectLabel &&
    workspaceLabel &&
    !selectedWorkspaceImplicit
  ) {
    return `${projectLabel} › ${workspaceLabel}`
  }

  if (currentSection === 'modules' && projectLabel) {
    return projectLabel
  }

  if (currentSection === 'workspaces' && projectLabel) {
    return projectLabel
  }

  return ''
})

function getRowScore(row: HarbourRow, query: string) {
  const label = row.label.toLowerCase()
  const metadata = row.metadata?.toLowerCase() ?? ''
  const labelIndex = label.indexOf(query)

  if (labelIndex >= 0) {
    return labelIndex
  }

  const metadataIndex = metadata.indexOf(query)

  if (metadataIndex >= 0) {
    return 100 + metadataIndex
  }

  return -1
}
