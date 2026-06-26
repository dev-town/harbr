import type { BoxRenderable, InputRenderable } from '@opentui/core'
import { RGBA } from '@opentui/core'
import { useBindings } from '@opentui/keymap/react'
import { useTerminalDimensions } from '@opentui/react'
import { useRef } from 'react'

import { theme } from '~/config/theme'
import { useRegisterFocusTarget } from '~/hooks/useRegisterFocusTarget'
import { makeCreateWorkspaceBindings } from '~/keymap/bindings'
import { keymapPriority } from '~/keymap/priorities'
import { useCreateWorkspace } from '~/routes/browse/hooks/use-create-workspace'

export function CreateWorkspaceModal() {
  const {
    isOpen,
    onBack,
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
  const { width } = useTerminalDimensions()
  const isNarrow = width < 90
  const modalWidth = getModalWidth(width, 56)
  const padding = isNarrow ? 0 : 1

  useRegisterFocusTarget('worktree-form', isOpen ? inputRef : null)

  useBindings(
    () =>
      isOpen
        ? {
            targetRef: inputRef,
            targetMode: 'focus-within',
            priority: keymapPriority.modal,
            bindings: makeCreateWorkspaceBindings({ onBack, onSubmit }),
          }
        : { bindings: [] },
    [inputRef, isOpen, onBack, onSubmit],
  )

  if (!isOpen) {
    return null
  }

  return (
    <box
      height="100%"
      left={0}
      onMouseUp={() => onClose()}
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
        border
        borderColor={showValidationError ? theme.error : theme.border}
        borderStyle="single"
        flexDirection="column"
        onMouseUp={(event: { stopPropagation(): void }) =>
          event.stopPropagation()
        }
        padding={padding}
        ref={focusRef}
        style={{ backgroundColor: theme.panel }}
        width={modalWidth}
      >
        <box
          flexDirection="column"
          marginBottom={1}
          paddingLeft={1}
          paddingRight={1}
          width="100%"
        >
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
              onInput={onInput}
              onSubmit={onSubmit}
              placeholder={placeholder}
              ref={inputRef}
              textColor={showValidationError ? theme.error : theme.text}
              value={value}
            />
          </box>
        </box>
        <box height={1} marginTop={1} width="100%">
          {showValidationError ? (
            <text fg={theme.error}>{validationError}</text>
          ) : null}
        </box>
      </box>
    </box>
  )
}

function getModalWidth(width: number, maxWidth: number) {
  return Math.max(36, Math.min(maxWidth, width - (width < 90 ? 4 : 8)))
}
