import { useAtomValue, useSetAtom, useStore } from 'jotai'

import { isLoadingAtom } from '../../../state/app'
import {
  browseQueryAtom,
  selectedBrowseRowIdAtom,
  hoveredBrowseRowIdAtom,
  browseVisibilityAtom,
  isActionsOpenAtom,
  isWorktreeFormOpenAtom,
} from '../atoms'
import { browseBreadcrumbAtom, selectedBrowseRowAtom, visibleBrowseRowsAtom } from '../derived'
import {
  backWorktreeFormAtom,
  closeActionsMenuAtom,
  hoverBrowseRowAtom,
  openActionsMenuAtom,
  selectBrowseRowAtom,
} from '../state/actions'
import { clearNotice, resetQuery, resetSelection } from '../../../actions/store'
import { useBrowseSearch } from './use-browse-search'
import { useBrowseSection } from './use-browse-section'

export function useBrowseRoute() {
  const store = useStore()
  const browseSearch = useBrowseSearch()
  const browseSection = useBrowseSection()
  const query = useAtomValue(browseQueryAtom)

  return {
    currentSection: browseSection.currentSection,
    breadcrumb: useAtomValue(browseBreadcrumbAtom),
    hoveredId: useAtomValue(hoveredBrowseRowIdAtom),
    isLoading: useAtomValue(isLoadingAtom),
    onBack: () => {
      if (store.get(isWorktreeFormOpenAtom)) {
        store.set(backWorktreeFormAtom)
        return
      }

      if (store.get(isActionsOpenAtom)) {
        store.set(closeActionsMenuAtom)
        return
      }

      if (query.length > 0) {
        resetQuery(store)
        resetSelection(store)
        clearNotice(store)
        return
      }

      browseSection.onBack()
    },
    onHoverRow: useSetAtom(hoverBrowseRowAtom),
    onOpenActions: useSetAtom(openActionsMenuAtom),
    onOpenRow: browseSection.onOpenRow,
    onSearchChange: browseSearch.onSearchChange,
    onSelectRow: useSetAtom(selectBrowseRowAtom),
    placeholder: browseSearch.placeholder,
    query: browseSearch.query,
    rows: useAtomValue(visibleBrowseRowsAtom),
    searchRef: browseSearch.searchRef,
    searchFocused: browseSearch.searchFocused,
    selectedId: useAtomValue(selectedBrowseRowIdAtom),
    selectedRow: useAtomValue(selectedBrowseRowAtom),
    visibility: useAtomValue(browseVisibilityAtom),
  }
}
