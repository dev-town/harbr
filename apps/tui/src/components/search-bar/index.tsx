import type { InputRenderable } from '@opentui/core'
import { useRef } from 'react'

import { theme } from '~/config/theme'

export function SearchBar({
  focused = true,
  inputRef: providedInputRef,
  onChange,
  onSubmit,
  placeholder,
  value,
}: {
  focused?: boolean
  inputRef?: { current: InputRenderable | null }
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  value: string
}) {
  const localInputRef = useRef<InputRenderable | null>(null)
  const inputRef = providedInputRef ?? localInputRef

  return (
    <box
      border
      borderColor={theme.borderSoft}
      borderStyle="rounded"
      height={3}
      paddingLeft={1}
      paddingRight={1}
      width="100%"
    >
      <box width="100%">
        <input
          focused={focused}
          ref={inputRef}
          onInput={onChange}
          onSubmit={onSubmit}
          placeholder={placeholder}
          value={value}
        />
      </box>
    </box>
  )
}
