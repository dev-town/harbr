import { useAtomValue, useSetAtom } from 'jotai'

import {
  actionRowsAtom,
  closeActionsMenuAtom,
  hoveredActionRowIdAtom,
  hoveredActionRowAtom,
  hoverActionRowAtom,
  isActionsOpenAtom,
  selectedActionRowAtom,
  selectedActionRowIdAtom,
  selectActionRowAtom,
} from '../../state'

export function useActionMenu() {
  return {
    rows: useAtomValue(actionRowsAtom),
    isOpen: useAtomValue(isActionsOpenAtom),
    hoveredId: useAtomValue(hoveredActionRowIdAtom),
    selectedId: useAtomValue(selectedActionRowIdAtom),
    hoveredRow: useAtomValue(hoveredActionRowAtom),
    selectedRow: useAtomValue(selectedActionRowAtom),
    onClose: useSetAtom(closeActionsMenuAtom),
    onHoverRow: useSetAtom(hoverActionRowAtom),
    onSelectRow: useSetAtom(selectActionRowAtom),
  }
}
