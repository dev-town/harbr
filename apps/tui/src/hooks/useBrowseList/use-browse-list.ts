import { useAtomValue, useSetAtom } from 'jotai'

import {
  currentSectionAtom,
  hoveredBrowseRowAtom,
  hoveredBrowseRowIdAtom,
  hoverBrowseRowAtom,
  isLoadingAtom,
  selectedBrowseRowAtom,
  selectedBrowseRowIdAtom,
  selectBrowseRowAtom,
} from '../../state'

export function useBrowseList() {
  return {
    currentSection: useAtomValue(currentSectionAtom),
    hoveredId: useAtomValue(hoveredBrowseRowIdAtom),
    selectedId: useAtomValue(selectedBrowseRowIdAtom),
    hoveredRow: useAtomValue(hoveredBrowseRowAtom),
    selectedRow: useAtomValue(selectedBrowseRowAtom),
    isLoading: useAtomValue(isLoadingAtom),
    onHoverRow: useSetAtom(hoverBrowseRowAtom),
    onSelectRow: useSetAtom(selectBrowseRowAtom),
  }
}
