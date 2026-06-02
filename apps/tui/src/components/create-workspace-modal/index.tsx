import type { BoxRenderable, InputRenderable } from '@opentui/core'
import { RGBA } from '@opentui/core'
import { useRef } from 'react'

import { theme } from '../../config/theme'
import { useCreateWorkspace } from '../../hooks/useCreateWorkspace'
import { Surface } from '../../keymap/layers'

export function CreateWorkspaceModal() {
  const {
    helperText,
    isOpen,
    onClose,
    onInput,
    onSubmit,
    placeholder,
    showValidationError,
    subtitle,
    title,
    validationError,
    value,
  } = useCreateWorkspace()
  const focusRef = useRef<BoxRenderable | null>(null)
  const inputRef = useRef<InputRenderable | null>(null)

  if (!isOpen) {
    return null
  }

  return (
    <Surface active focusTargetRef={inputRef} id="worktree-form">
      <box
        onMouseUp={() => onClose()}
        height="100%"
        left={0}
        position="absolute"
        style={{ justifyContent: 'center', alignItems: 'center' }}
        top={0}
        width="100%"
      >
        <box
          height="100%"
          left={0}
          position="absolute"
          style={{ backgroundColor: RGBA.fromInts(0, 0, 0, 150) }}
          top={0}
          width="100%"
        />
        <box
          onMouseUp={(event: { stopPropagation(): void }) => event.stopPropagation()}
          border
          borderColor={showValidationError ? theme.error : theme.border}
          borderStyle="single"
          flexDirection="column"
          padding={1}
          ref={focusRef}
          style={{ backgroundColor: theme.panel }}
          width="42%"
        >
          <box flexDirection="column" marginBottom={1} paddingLeft={1} paddingRight={1} width="100%">
            <text>
              <strong fg={theme.text}>{title}</strong>
            </text>
            <text fg={theme.muted}>{subtitle}</text>
          </box>
          <box
            border
            borderColor={showValidationError ? theme.error : theme.borderSoft}
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
                focusedTextColor={showValidationError ? theme.error : theme.text}
                ref={inputRef}
                onInput={onInput}
                onSubmit={onSubmit}
                placeholder={placeholder}
                textColor={showValidationError ? theme.error : theme.text}
                value={value}
              />
            </box>
          </box>
          <box height={1} marginTop={1} width="100%">
            {showValidationError ? (
              <text fg={theme.error}>{validationError}</text>
            ) : (
              <text fg={theme.muted}>{helperText}</text>
            )}
          </box>
        </box>
      </box>
    </Surface>
  )
}
