import type { HarbourRow } from '../../../types/rows'

import { theme } from '../../../config/theme'

export function getKindChip(row: HarbourRow) {
  if (row.kind === 'project') {
    return { color: theme.accent, label: 'project' }
  }

  if (row.kind === 'workspace') {
    return { color: theme.warning, label: row.isDefault ? 'default' : 'workspace' }
  }

  if (row.kind === 'module') {
    return { color: theme.violet, label: 'module' }
  }

  return { color: theme.muted, label: row.kind }
}
