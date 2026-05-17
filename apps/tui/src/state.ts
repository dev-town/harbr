import type {
  HarbourRow,
  HarbourSection,
  ProjectRow,
  VisibilityFilter,
} from '@harbour/domain'
import { atom } from 'jotai'

export const currentSectionAtom = atom<HarbourSection>('projects')
export const footerAtom = atom(
  'Enter drill next · Tab active/all · Ctrl+R refresh · Esc clear/close',
)
export const loadingAtom = atom(true)
export const noticeAtom = atom<string | null>(null)
export const projectRowsAtom = atom<readonly ProjectRow[]>([])
export const queryAtom = atom('')
export const selectedIndexAtom = atom(0)
export const visibilityAtom = atom<VisibilityFilter>('active')

export const effectiveVisibilityAtom = atom((get) => {
  const visibility = get(visibilityAtom)
  const rows = get(projectRowsAtom)

  if (visibility === 'all') {
    return visibility
  }

  return rows.some((row) => row.isActive) ? 'active' : 'all'
})

export const visibleRowsAtom = atom<readonly HarbourRow[]>((get) => {
  const visibility = get(effectiveVisibilityAtom)
  const query = get(queryAtom).trim().toLowerCase()
  const baseRows = get(projectRowsAtom)
  const scopedRows =
    visibility === 'active'
      ? baseRows.filter((row) => row.isActive)
      : [...baseRows]

  if (!query) {
    return scopedRows
  }

  return scopedRows
    .map((row) => ({
      row,
      score: getRowScore(row, query),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => left.score - right.score)
    .map((entry) => entry.row)
})

function getRowScore(row: ProjectRow, query: string) {
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
