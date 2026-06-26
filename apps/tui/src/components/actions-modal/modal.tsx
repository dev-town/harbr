import type { BoxRenderable } from '@opentui/core'
import { RGBA } from '@opentui/core'
import { useRef } from 'react'

import { theme } from '~/config/theme'
import { useActionHover } from './hooks/use-action-hover'
import { useActionKeybindings } from './hooks/use-action-keybindings'
import { useActionModalLayout } from './hooks/use-action-modal-layout'
import { useActionSelection } from './hooks/use-action-selection'
import type { ActionItemBase, ActionsModalProps } from './types'

export function ActionsModal<T extends ActionItemBase>({
  focusRef,
  initialSelectedId,
  isOpen,
  items,
  onClose,
  onSelect,
  title = 'Actions',
}: ActionsModalProps<T>) {
  const localFocusRef = useRef<BoxRenderable | null>(null)
  const modalRef = focusRef ?? localFocusRef
  const { modalWidth, padding } = useActionModalLayout()
  const { clearHoveredId, hoveredId, setHoveredId } = useActionHover(isOpen)
  const { moveSelection, selectedId, selectCurrent, setSelectedId } =
    useActionSelection({ initialSelectedId, isOpen, items, onSelect })

  useActionKeybindings({
    enabled: isOpen,
    moveSelection,
    onClose,
    selectCurrent,
  })

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
        borderColor={theme.border}
        borderStyle="single"
        focusable
        flexDirection="column"
        onMouseUp={(event: { stopPropagation(): void }) =>
          event.stopPropagation()
        }
        padding={padding}
        ref={modalRef}
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
        </box>
        <box flexDirection="column" width="100%">
          {items.map((item) => {
            const isDisabled = Boolean(item.disabledNotice)
            const isHovered = hoveredId === item.id
            const isSelected = selectedId === item.id

            return (
              <box
                key={item.id}
                onMouseDown={() => {
                  setSelectedId(item.id)
                  onSelect(item)
                }}
                onMouseOut={clearHoveredId}
                onMouseOver={() => setHoveredId(item.id)}
                paddingLeft={1}
                paddingRight={1}
                style={{
                  backgroundColor: isSelected
                    ? theme.selection
                    : isHovered
                      ? theme.panelSoft
                      : theme.panel,
                }}
                width="100%"
              >
                <text>
                  <span fg={isSelected ? theme.accent : theme.muted}>
                    {isSelected ? '›' : ' '}
                  </span>
                  <span fg={theme.text}> </span>
                  <span
                    fg={
                      isDisabled
                        ? theme.muted
                        : isSelected
                          ? theme.activeText
                          : theme.text
                    }
                  >
                    {item.label}
                  </span>
                </text>
              </box>
            )
          })}
        </box>
      </box>
    </box>
  )
}
