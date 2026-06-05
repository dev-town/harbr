import type { BoxRenderable } from '@opentui/core'
import { RGBA } from '@opentui/core'
import { useRef } from 'react'

import { theme } from '../../../../config/theme'
import { useRegisterFocusTarget } from '../../../../hooks/useRegisterFocusTarget'
import { useBrowseActions } from '../../hooks/use-browse-actions'

export function ActionsModal() {
  const {
    hoveredId,
    isOpen,
    onClose,
    onHoverRow,
    onSelectAction,
    onSelectRow,
    rows,
    selectedId,
  } = useBrowseActions()
  const focusRef = useRef<BoxRenderable | null>(null)

  useRegisterFocusTarget('actions', isOpen ? focusRef : null)

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
        flexDirection="column"
        onMouseUp={(event: { stopPropagation(): void }) =>
          event.stopPropagation()
        }
        padding={1}
        ref={focusRef}
        style={{ backgroundColor: theme.panel }}
        width="36%"
      >
        <box
          flexDirection="column"
          marginBottom={1}
          paddingLeft={1}
          paddingRight={1}
          width="100%"
        >
          <text>
            <strong fg={theme.text}>Actions</strong>
          </text>
        </box>
        <box flexDirection="column" width="100%">
          {rows.map((row) => {
            const isHovered = hoveredId === row.id
            const isSelected = selectedId === row.id

            return (
              <box
                key={row.id}
                onMouseDown={() => {
                  onSelectRow(row.id)
                  onSelectAction()
                }}
                onMouseOut={() => onHoverRow(null)}
                onMouseOver={() => onHoverRow(row.id)}
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
                  <span fg={isSelected ? theme.activeText : theme.text}>
                    {row.label}
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
