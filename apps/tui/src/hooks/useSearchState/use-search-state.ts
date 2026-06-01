import type { InputRenderable } from '@opentui/core'

import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'

import { getPlaceholder } from '../../helpers/labels'
import {
  browseQueryAtom,
  browseSearchFocusNonceAtom,
  changeQueryAtom,
  currentRowCountAtom,
  currentSectionAtom,
  effectiveVisibilityAtom,
  isActionsOpenAtom,
  selectedBrowseRowIdAtom,
} from '../../state'

export function useSearchState({
  focused,
  inputRef,
}: {
  focused: boolean
  inputRef: { current: InputRenderable | null }
}) {
  const isActionsOpen = useAtomValue(isActionsOpenAtom)
  const currentSection = useAtomValue(currentSectionAtom)
  const focusSearchNonce = useAtomValue(browseSearchFocusNonceAtom)
  const onChangeQuery = useSetAtom(changeQueryAtom)
  const query = useAtomValue(browseQueryAtom)
  const rowCount = useAtomValue(currentRowCountAtom)
  const selectedId = useAtomValue(selectedBrowseRowIdAtom)
  const visibility = useAtomValue(effectiveVisibilityAtom)

  useEffect(() => {
    if (!focused) {
      return
    }

    inputRef.current?.focus?.()
  }, [focusSearchNonce, focused, inputRef, rowCount, selectedId, visibility])

  return {
    onChangeQuery,
    placeholder: getPlaceholder(currentSection, isActionsOpen),
    query,
  }
}
