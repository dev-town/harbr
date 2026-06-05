import { useAtomValue, useSetAtom, useStore } from 'jotai'

import { useTuiServices } from '../../../hooks/useTuiServices'
import {
  actionRowsAtom,
  hoveredActionRowIdAtom,
  isActionsOpenAtom,
  selectedActionRowIdAtom,
} from '../atoms'
import {
  closeActionsMenuAtom,
  hoverActionRowAtom,
  moveActionSelectionAtom,
  selectActionRowAtom,
} from '../state/actions'
import { hoveredActionRowAtom, selectedActionRowAtom } from '../derived'
import { handleBrowseActionSelect } from '../actions'

export function useBrowseActions() {
  const services = useTuiServices()
  const store = useStore()

  return {
    hoveredId: useAtomValue(hoveredActionRowIdAtom),
    hoveredRow: useAtomValue(hoveredActionRowAtom),
    isOpen: useAtomValue(isActionsOpenAtom),
    onClose: useSetAtom(closeActionsMenuAtom),
    onHoverRow: useSetAtom(hoverActionRowAtom),
    onMoveSelection: useSetAtom(moveActionSelectionAtom),
    onSelectAction: () => handleBrowseActionSelect(services, store),
    onSelectRow: useSetAtom(selectActionRowAtom),
    rows: useAtomValue(actionRowsAtom),
    selectedId: useAtomValue(selectedActionRowIdAtom),
    selectedRow: useAtomValue(selectedActionRowAtom),
  }
}
