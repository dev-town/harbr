import type { TuiServices, TuiStore } from '../../../app-context'
import { openActiveRuntime } from '../../../actions/runtime'
import { selectIsActiveActionsOpen, selectSelectedActiveRow } from '../../../store'

export function handleActiveRouteBack(services: TuiServices, store: TuiStore) {
  if (selectIsActiveActionsOpen(store.getState())) {
    store.getState().closeActionsMenu()
    return
  }

  const query = store.getState().active.list.query

  if (query.length > 0) {
    store.getState().resetActiveQuery()
    store.getState().resetActiveSelection()
    store.getState().clearNotice()
    return
  }

  services.renderer.destroy()
}

export function handleActiveRouteSelect(services: TuiServices, store: TuiStore) {
  const row = selectSelectedActiveRow(store.getState())

  if (!row) {
    return
  }

  void openActiveRuntime(services, store, row)
}
