import { useAtomValue } from 'jotai'
import { useEffect, useRef } from 'react'

import { handleQueryChange, handleQuerySubmit } from '../../actions'
import { theme } from '../../config/theme'
import { useTuiContext } from '../../app-context'
import { getPlaceholder } from '../../helpers/labels'
import { actionsOpenAtom, currentRowsAtom, currentSectionAtom, effectiveVisibilityAtom, type FocusTargetRef, focusSearchNonceAtom, queryAtom, selectedIndexAtom } from '../../state'

export function SearchBar({
  focused = true,
  inputRef: providedInputRef,
}: {
  focused?: boolean
  inputRef?: FocusTargetRef
}) {
  const context = useTuiContext()
  const actionsOpen = useAtomValue(actionsOpenAtom)
  const currentSection = useAtomValue(currentSectionAtom)
  const focusSearchNonce = useAtomValue(focusSearchNonceAtom)
  const query = useAtomValue(queryAtom)
  const selectedIndex = useAtomValue(selectedIndexAtom)
  const visibility = useAtomValue(effectiveVisibilityAtom)
  const rows = useAtomValue(currentRowsAtom)
  const localInputRef = useRef<FocusTargetRef['current']>(null)
  const inputRef = providedInputRef ?? localInputRef

  useEffect(() => {
    if (!focused) {
      return
    }

    inputRef.current?.focus?.()
  }, [focusSearchNonce, focused, selectedIndex, visibility, rows.length])

  return (
    <box
      border
      borderColor={theme.borderSoft}
      borderStyle="single"
      height={3}
      paddingLeft={1}
      paddingRight={1}
      style={{ backgroundColor: theme.search }}
      width="100%"
    >
      <box style={{ justifyContent: 'center' }} width="100%">
        <input
          focused={focused}
          ref={inputRef}
          onInput={(value) => handleQueryChange(context, value)}
          onSubmit={() => handleQuerySubmit(context)}
          placeholder={getPlaceholder(currentSection, actionsOpen)}
          value={query}
        />
      </box>
    </box>
  )
}
