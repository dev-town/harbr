import type { InputRenderable } from '@opentui/core'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useRef } from 'react'

import { getPlaceholder } from '../../../helpers/labels'
import { useRegisterFocusTarget } from '../../../hooks/useRegisterFocusTarget'
import {
  browseQueryAtom,
  browseSearchFocusNonceAtom,
  browseSectionAtom,
  isActionsOpenAtom,
  isWorktreeFormOpenAtom,
  selectedBrowseRowIdAtom,
} from '../atoms'
import { changeBrowseQueryAtom } from '../state/actions'
import { visibleBrowseRowsAtom } from '../derived'

export function useBrowseSearch() {
  const searchRef = useRef<InputRenderable | null>(null)
  const currentSection = useAtomValue(browseSectionAtom)
  const query = useAtomValue(browseQueryAtom)
  const focusSearchNonce = useAtomValue(browseSearchFocusNonceAtom)
  const selectedId = useAtomValue(selectedBrowseRowIdAtom)
  const rows = useAtomValue(visibleBrowseRowsAtom)
  const isActionsOpen = useAtomValue(isActionsOpenAtom)
  const isWorktreeFormOpen = useAtomValue(isWorktreeFormOpenAtom)
  const isSearchFocused = !isActionsOpen && !isWorktreeFormOpen

  useRegisterFocusTarget('browser', searchRef)

  useEffect(() => {
    if (!isSearchFocused) {
      return
    }

    searchRef.current?.focus?.()
  }, [focusSearchNonce, isSearchFocused, rows.length, selectedId])

  return {
    onSearchChange: useSetAtom(changeBrowseQueryAtom),
    placeholder: getPlaceholder(currentSection, 'browse'),
    query,
    searchFocused: isSearchFocused,
    searchRef,
  }
}
