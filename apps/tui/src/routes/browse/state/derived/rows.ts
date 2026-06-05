import { atom } from 'jotai'
import type { RuntimeFact } from '@harbour/domain'

import { currentRuntimeAtom } from '../../../../state/app'
import { moduleRowsAtom, projectRowsAtom, workspaceRowsAtom } from '../../../../state/rows'
import type { HarbourRow } from '../../../../types/rows'
import { browseQueryAtom, browseSectionAtom, browseVisibilityAtom } from '../atoms'

export const currentBrowseSectionAtom = atom((get) => get(browseSectionAtom))

export const browseRowsAtom = atom<readonly HarbourRow[]>((get) => {
  const currentSection = get(browseSectionAtom)

  if (currentSection === 'modules') {
    return get(moduleRowsAtom)
  }

  if (currentSection === 'workspaces') {
    return get(workspaceRowsAtom)
  }

  return get(projectRowsAtom)
})

export const visibleBrowseRowsAtom = atom<readonly HarbourRow[]>((get) => {
  const visibility = get(browseVisibilityAtom)
  const query = get(browseQueryAtom).trim().toLowerCase()
  const currentRuntime = get(currentRuntimeAtom)
  const baseRows = get(browseRowsAtom).map((row) => ({
    ...row,
    isCurrent: isCurrentBrowseRow(row, currentRuntime),
  }))
  const scopedRows = visibility === 'active' ? baseRows.filter((row) => row.isActive) : [...baseRows]

  if (!query) {
    return scopedRows
  }

  return scopedRows
    .map((row) => ({ row, score: getBrowseRowScore(row, query) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => left.score - right.score)
    .map((entry) => entry.row)
})

function getBrowseRowScore(row: HarbourRow, query: string) {
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

function isCurrentBrowseRow(row: HarbourRow, currentRuntime: RuntimeFact | null) {
  if (!currentRuntime) {
    return false
  }

  if (row.kind === 'project') {
    return currentRuntime.scope === 'project' && row.label === currentRuntime.projectName
  }

  if (row.kind === 'workspace') {
    return currentRuntime.scope === 'workspace' && row.label === currentRuntime.workspaceName
  }

  if (row.kind === 'module') {
    return currentRuntime.scope === 'module' && row.label === currentRuntime.moduleName
  }

  return false
}
