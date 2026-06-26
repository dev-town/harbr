import type { VisibilityFilter } from '~/types/navigation'

import { theme } from '~/config/theme'

export function visibilityColor(visibility: VisibilityFilter) {
  return visibility === 'active' ? theme.active : theme.warning
}
