import type { BoxRenderable } from '@opentui/core'
import { RGBA } from '@opentui/core'
import { useTerminalDimensions } from '@opentui/react'
import type { ForwardedRef, ReactElement } from 'react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

import { theme } from '../../config/theme'

type ActionItemBase = {
  id: string
  label: string
}

export type ActionsModalHandle = {
  activateSelection: () => void
  close: () => void
  moveSelection: (delta: number) => void
}

type ActionsModalProps<T extends ActionItemBase> = {
  focusRef?: { current: BoxRenderable | null }
  initialSelectedId?: string | null
  isOpen: boolean
  items: readonly T[]
  onClose: () => void
  onSelect: (item: T) => void
  title?: string
}

export const ActionsModal = forwardRef(function ActionsModalInner<T extends ActionItemBase>(
  {
    focusRef,
    initialSelectedId,
    isOpen,
    items,
    onClose,
    onSelect,
    title = 'Actions',
  }: ActionsModalProps<T>,
  ref: ForwardedRef<ActionsModalHandle>,
) {
  const localFocusRef = useRef<BoxRenderable | null>(null)
  const modalRef = focusRef ?? localFocusRef
  const { width } = useTerminalDimensions()
  const isNarrow = width < 90
  const modalWidth = getModalWidth(width, 48)
  const padding = isNarrow ? 0 : 1
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const initialResolvedId = useMemo(
    () => resolveInitialSelectedId(items, initialSelectedId),
    [initialSelectedId, items],
  )

  useEffect(() => {
    if (!isOpen) {
      setHoveredId(null)
      setSelectedId(null)
      return
    }

    setHoveredId(null)
    setSelectedId(initialResolvedId)
  }, [initialResolvedId, isOpen])

  useImperativeHandle(ref, () => ({
    activateSelection: () => {
      const item = items.find((entry) => entry.id === selectedId) ?? items[0]

      if (item) {
        onSelect(item)
      }
    },
    close: onClose,
    moveSelection: (delta: number) => {
      if (items.length === 0) {
        return
      }

      const currentIndex = getIndexForItemId(items, selectedId)
      const nextIndex = clampIndex(currentIndex + delta, items.length)

      setSelectedId(items[nextIndex]?.id ?? null)
    },
  }), [items, onClose, onSelect, selectedId])

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
        onMouseUp={(event: { stopPropagation(): void }) => event.stopPropagation()}
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
            const isHovered = hoveredId === item.id
            const isSelected = selectedId === item.id

            return (
              <box
                key={item.id}
                onMouseDown={() => {
                  setSelectedId(item.id)
                  onSelect(item)
                }}
                onMouseOut={() => setHoveredId(null)}
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
                  <span fg={isSelected ? theme.accent : theme.muted}>{isSelected ? '›' : ' '}</span>
                  <span fg={theme.text}> </span>
                  <span fg={isSelected ? theme.activeText : theme.text}>{item.label}</span>
                </text>
              </box>
            )
          })}
        </box>
      </box>
    </box>
  )
}) as <T extends ActionItemBase>(
  props: ActionsModalProps<T> & { ref?: ForwardedRef<ActionsModalHandle> },
) => ReactElement | null

function resolveInitialSelectedId<T extends ActionItemBase>(items: readonly T[], initialSelectedId?: string | null) {
  if (initialSelectedId && items.some((item) => item.id === initialSelectedId)) {
    return initialSelectedId
  }

  return items[0]?.id ?? null
}

function getIndexForItemId(items: readonly ActionItemBase[], itemId: string | null) {
  if (items.length === 0) {
    return 0
  }

  const index = itemId ? items.findIndex((item) => item.id === itemId) : -1

  return index >= 0 ? index : 0
}

function clampIndex(index: number, length: number) {
  if (length === 0) {
    return 0
  }

  return Math.max(0, Math.min(length - 1, index))
}

function getModalWidth(width: number, maxWidth: number) {
  return Math.max(32, Math.min(maxWidth, width - (width < 90 ? 4 : 10)))
}
