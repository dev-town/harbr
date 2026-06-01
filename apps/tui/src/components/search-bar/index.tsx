import type { InputRenderable } from '@opentui/core'
import { useRef } from 'react'

import { theme } from '../../config/theme'
import { useSearchState } from '../../hooks/useSearchState'

export function SearchBar({
  focused = true,
  inputRef: providedInputRef,
  onSubmit,
}: {
  focused?: boolean
  inputRef?: { current: InputRenderable | null }
  onSubmit: () => void
}) {
  const localInputRef = useRef<InputRenderable | null>(null)
  const inputRef = providedInputRef ?? localInputRef
  const { onChangeQuery, placeholder, query } = useSearchState({
    focused,
    inputRef,
  })

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
          onInput={onChangeQuery}
          onSubmit={onSubmit}
          placeholder={placeholder}
          value={query}
        />
      </box>
    </box>
  )
}
