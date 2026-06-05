import type { TuiServices, TuiStore } from '../../../app-context'
import { openActiveRuntime } from '../../../actions/runtime'
import type { ActiveActionRow } from '../../../types/rows'

export function handleActiveActionSelect(services: TuiServices, store: TuiStore, row: ActiveActionRow | null) {
  if (!row || row.kind !== 'active-action') {
    return
  }

  void openActiveRuntime(services, store, row.target)
}
