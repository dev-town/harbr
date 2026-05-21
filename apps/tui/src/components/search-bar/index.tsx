import { useAtomValue } from 'jotai'
import { useEffect, useRef } from 'react'

import { handleQueryChange, handleQuerySubmit } from '../../actions'
import { theme } from '../../config/theme'
import { useTuiContext } from '../../app-context'
import { getPlaceholder } from '../../helpers/labels'
import { currentSectionAtom, effectiveVisibilityAtom, focusSearchNonceAtom, queryAtom, selectedIndexAtom, visibleRowsAtom } from '../../state'

export function SearchBar() {
  const context = useTuiContext()
  const currentSection = useAtomValue(currentSectionAtom)
  const focusSearchNonce = useAtomValue(focusSearchNonceAtom)
  const query = useAtomValue(queryAtom)
  const selectedIndex = useAtomValue(selectedIndexAtom)
  const visibility = useAtomValue(effectiveVisibilityAtom)
  const rows = useAtomValue(visibleRowsAtom)
  const inputRef = useRef<{ focus?: () => void } | null>(null)

  useEffect(() => {
    inputRef.current?.focus?.()
  }, [focusSearchNonce, selectedIndex, visibility, rows.length])

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
          focused
          ref={inputRef}
          onInput={(value) => handleQueryChange(context, value)}
          onSubmit={() => handleQuerySubmit(context)}
          placeholder={getPlaceholder(currentSection)}
          value={query}
        />
      </box>
    </box>
  )
}
