import type { ListRowMeta, RowVariant } from './types'

export function getRowVariant(width: number): RowVariant {
  if (width < 100) {
    return 'stacked'
  }

  return 'default'
}

export function getInlineMeta(
  meta: ListRowMeta,
  variant: Exclude<RowVariant, 'stacked'>,
) {
  const parts: string[] = []

  if (meta.breadcrumb) {
    parts.push(meta.breadcrumb)
  } else if (meta.branch) {
    parts.push(` ${meta.branch}`)
  }

  if (
    meta.sessions &&
    (variant === 'default' || (!meta.breadcrumb && !meta.branch))
  ) {
    parts.push(`● ${meta.sessions}`)
  }

  return parts.join('  ')
}

export function getStackedMeta(meta: ListRowMeta) {
  const parts: string[] = []

  if (meta.breadcrumb) {
    parts.push(meta.breadcrumb)
  }

  if (meta.branch) {
    parts.push(` ${meta.branch}`)
  }

  if (meta.sessions) {
    parts.push(`● ${meta.sessions}`)
  }

  return parts.join('  ')
}
