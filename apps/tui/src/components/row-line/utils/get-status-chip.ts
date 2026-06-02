import type { HarbourRow } from '../../../types/rows'

import { theme } from '../../../config/theme'

export function getStatusChip(row: HarbourRow) {
  if (row.kind === 'project' || row.kind === 'workspace') {
    if (row.activeSessionCount > 0) {
      const count = row.activeSessionCount === 1 ? '1 session' : `${row.activeSessionCount} sessions`
      return { color: theme.active, icon: '●', label: count }
    }

    return { color: theme.idle, icon: '○', label: 'idle' }
  }

  if (row.kind === 'module') {
    return row.hasSession
      ? { color: theme.active, icon: '󰆍', label: 'live' }
      : { color: theme.idle, icon: '󰈈', label: 'idle' }
  }

  return { color: theme.muted, icon: '•', label: row.metadata ?? 'state' }
}
