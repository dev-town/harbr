import { useAtomValue, useStore } from 'jotai'

import { handleActionSelect } from '../../actions/actions'
import { handleBrowseSelect } from '../../actions/browser'
import { isActionsOpenAtom, visibleBrowseRowsAtom } from '../../state'
import { useTuiServices } from '../useTuiServices'

export function useBrowserSurface() {
  const services = useTuiServices()
  const store = useStore()

  return {
    browseRows: useAtomValue(visibleBrowseRowsAtom),
    isActionsOpen: useAtomValue(isActionsOpenAtom),
    onActionSelect: () => handleActionSelect(services, store),
    onBrowseSelect: () => handleBrowseSelect(services, store),
  }
}
