import type { TuiServices, TuiStore } from '../../../app-context'
import { closeActiveRuntime, openActiveRuntime } from '../../../actions/runtime'
import { activeActionIds } from '../../../store'
import type { ActiveActionRow } from '../../../types/rows'

export function handleActiveActionSelect(
  services: TuiServices,
  store: TuiStore,
  row: ActiveActionRow | null,
) {
  if (!row || row.kind !== 'active-action') {
    return
  }

  if (row.disabledNotice) {
    store.getState().setNotice(row.disabledNotice, 'warning')
    return
  }

  if (row.actionId === activeActionIds.closeRuntimeSession) {
    void closeActiveRuntime(services, store, row.target)
    return
  }

  if (row.actionId === activeActionIds.createRuntimeWindows) {
    if (!row.windowTarget) {
      store.getState().setNotice('Window target missing', 'warning')
      return
    }

    store.getState().openWindowPicker(row.windowTarget, row.target.contextLabel)
    return
  }

  void openActiveRuntime(services, store, row.target)
}
