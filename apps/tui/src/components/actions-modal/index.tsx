import type { ActionRow } from '@harbour/domain'
import { RGBA } from '@opentui/core'
import { useAtomValue } from 'jotai'

import { closeActionsMenu, handleActionSelect, handleRowHover } from '../../actions'
import { useTuiContext } from '../../app-context'
import { theme } from '../../config/theme'
import { actionSelectedIndexAtom, actionsOpenAtom, type FocusTargetRef, hoveredIndexAtom } from '../../state'

export function ActionsModal({
  focusRef,
  rows,
}: {
  focusRef?: FocusTargetRef
  rows: readonly ActionRow[]
}) {
  const context = useTuiContext()
  const actionSelectedIndex = useAtomValue(actionSelectedIndexAtom)
  const actionsOpen = useAtomValue(actionsOpenAtom)
  const hoveredIndex = useAtomValue(hoveredIndexAtom)

  if (!actionsOpen) {
    return null
  }

  return (
    <box
      onMouseUp={() => closeActionsMenu(context)}
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
        borderColor={theme.border}
        borderStyle="single"
        flexDirection="column"
        padding={1}
        ref={focusRef}
        style={{ backgroundColor: theme.panel }}
        width="36%"
      >
        <box flexDirection="column" marginBottom={1} paddingLeft={1} paddingRight={1} width="100%">
          <text>
            <strong fg={theme.text}>Actions</strong>
          </text>
        </box>
        <box flexDirection="column" width="100%">
          {rows.map((row, index) => {
            const isHovered = hoveredIndex === index
            const isSelected = index === actionSelectedIndex

            return (
              <box
                key={row.id}
                onMouseDown={() => {
                  context.store.set(actionSelectedIndexAtom, index)
                  handleActionSelect(context)
                }}
                onMouseOut={() => handleRowHover(context, null)}
                onMouseOver={() => handleRowHover(context, index)}
                paddingLeft={1}
                paddingRight={1}
                style={{ backgroundColor: isSelected ? theme.selection : isHovered ? theme.panelSoft : theme.panel }}
                width="100%"
              >
                <text>
                  <span fg={isSelected ? theme.accent : theme.muted}>{isSelected ? '›' : ' '}</span>
                  <span fg={theme.text}> </span>
                  <span fg={isSelected ? '#f5f7ff' : theme.text}>{row.label}</span>
                </text>
              </box>
            )
          })}
        </box>
      </box>
    </box>
  )
}
