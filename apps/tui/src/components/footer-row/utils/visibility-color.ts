import type { VisibilityFilter } from '@harbour/domain'

import { theme } from '../../../config/theme'

export function visibilityColor(visibility: VisibilityFilter) {
  return visibility === 'active' ? theme.active : theme.warning
}
