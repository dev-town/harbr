export function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`
}

export function truncateLeft(value: string, maxLength: number) {
  return value.length <= maxLength
    ? value
    : `…${value.slice(value.length - maxLength + 1)}`
}

export function padCell(value: string, width: number) {
  return truncate(value, width).padEnd(width, ' ')
}

export function padChip(value: string, width: number) {
  return truncate(value, width).padEnd(width, ' ')
}
