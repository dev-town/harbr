import type { TuiServices, TuiStore } from '../../../app-context'
import { openActiveRuntime } from '../../../actions/runtime'
import { clearNotice, resetActiveQuery, resetActiveSelection } from '../../../actions/store'
import { activeQueryAtom, isActionsOpenAtom } from '../state/atoms'
import { closeActionsMenuAtom } from '../state/actions'
import { selectedActiveRowAtom } from '../state/derived'

export function handleActiveRouteBack(services: TuiServices, store: TuiStore) {
  if (store.get(isActionsOpenAtom)) {
    store.set(closeActionsMenuAtom)
    return
  }

  const query = store.get(activeQueryAtom)

  if (query.length > 0) {
    resetActiveQuery(store)
    resetActiveSelection(store)
    clearNotice(store)
    return
  }

  services.renderer.destroy()
}

export function handleActiveRouteSelect(services: TuiServices, store: TuiStore) {
  const row = store.get(selectedActiveRowAtom)

  if (!row) {
    return
  }

  void openActiveRuntime(services, store, row)
}
