export function clampIndex(index: number, rowCount: number) {
  if (rowCount === 0) {
    return 0
  }

  return Math.max(0, Math.min(index, rowCount - 1))
}
