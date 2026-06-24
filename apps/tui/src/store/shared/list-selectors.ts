import { clampIndex } from '../../helpers/selection'

export function getSelectedRow<TRow extends { id: string }>(
  rows: readonly TRow[],
  selectedId: string | null,
) {
  return rows.find((row) => row.id === selectedId) ?? null
}

export function getRepairedSelectedId<TRow extends { id: string }>(
  rows: readonly TRow[],
  selectedId: string | null,
) {
  if (selectedId && rows.some((row) => row.id === selectedId)) {
    return selectedId
  }

  return rows[0]?.id ?? null
}

export function moveSelectedId<TRow extends { id: string }>(
  rows: readonly TRow[],
  selectedId: string | null,
  delta: number,
) {
  if (rows.length === 0) {
    return null
  }

  const currentIndex = selectedId
    ? rows.findIndex((row) => row.id === selectedId)
    : -1
  const safeIndex = currentIndex >= 0 ? currentIndex : 0
  const nextIndex = clampIndex(safeIndex + delta, rows.length)

  return rows[nextIndex]?.id ?? null
}
