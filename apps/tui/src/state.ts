import type {
  HarbourRow,
  HarbourSection,
  ModuleRow,
  ProjectRow,
  VisibilityFilter,
  WorkspaceRow,
} from '@harbour/domain'
import { atom } from 'jotai'

export const currentSectionAtom = atom<HarbourSection>('projects')
export const loadingAtom = atom(true)
export const noticeAtom = atom<string | null>(null)
export const projectRowsAtom = atom<readonly ProjectRow[]>([])
export const queryAtom = atom('')
export const selectedIndexAtom = atom(0)
export const selectedProjectIdAtom = atom<string | null>(null)
export const selectedWorkspaceIdAtom = atom<string | null>(null)
export const visibilityAtom = atom<VisibilityFilter>('active')
export const moduleRowsAtom = atom<readonly ModuleRow[]>([])
export const workspaceRowsAtom = atom<readonly WorkspaceRow[]>([])

export const currentRowsAtom = atom<readonly HarbourRow[]>((get) => {
  const currentSection = get(currentSectionAtom)

  if (currentSection === 'modules') {
    return get(moduleRowsAtom)
  }

  if (currentSection === 'workspaces') {
    return get(workspaceRowsAtom)
  }

  return get(projectRowsAtom)
})

export const effectiveVisibilityAtom = atom((get) => {
  const visibility = get(visibilityAtom)
  const rows = get(currentRowsAtom)

  if (visibility === 'all') {
    return visibility
  }

  return rows.some((row) => row.isActive) ? 'active' : 'all'
})

export const footerAtom = atom((get) => {
  const query = get(queryAtom)
  const currentSection = get(currentSectionAtom)

  if (query.length > 0) {
    return 'Enter drill next · Tab active/all · Esc clear query'
  }

  if (currentSection === 'workspaces') {
    return 'Enter drill next · Tab active/all · Ctrl+R refresh · Esc back'
  }

  if (currentSection === 'modules') {
    return 'Enter attach/create next · Tab active/all · Ctrl+R refresh · Esc back'
  }

  return 'Enter drill next · Tab active/all · Ctrl+R refresh · Esc close'
})

export const breadcrumbAtom = atom((get) => {
  const selectedProjectId = get(selectedProjectIdAtom)
  const selectedWorkspaceId = get(selectedWorkspaceIdAtom)
  const currentSection = get(currentSectionAtom)
  const moduleRows = get(moduleRowsAtom)
  const projectRows = get(projectRowsAtom)
  const projectLabel = projectRows.find((row) => row.projectId === selectedProjectId)?.label
  const workspaceLabel = get(workspaceRowsAtom).find(
    (row) => row.workspaceId === selectedWorkspaceId,
  )?.label

  if (currentSection === 'modules' && projectLabel && workspaceLabel) {
    return `${projectLabel} › ${workspaceLabel}`
  }

  if (currentSection === 'workspaces' && projectLabel) {
    return projectLabel
  }

  if (currentSection === 'modules' && projectLabel && moduleRows.length === 0) {
    return projectLabel
  }

  return 'Harbour'
})

export const visibleRowsAtom = atom<readonly HarbourRow[]>((get) => {
  const visibility = get(effectiveVisibilityAtom)
  const query = get(queryAtom).trim().toLowerCase()
  const baseRows = get(currentRowsAtom)
  const scopedRows =
    visibility === 'active'
      ? baseRows.filter((row) => row.isActive)
      : [...baseRows]

  if (!query) {
    return scopedRows
  }

  return scopedRows
    .map((row) => ({ row, score: getRowScore(row, query) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => left.score - right.score)
    .map((entry) => entry.row)
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
