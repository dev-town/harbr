import type { BoxRenderable, ScrollBoxRenderable } from '@opentui/core'
import { RGBA } from '@opentui/core'
import { useBindings, useKeymap } from '@opentui/keymap/react'
import { useTerminalDimensions } from '@opentui/react'
import { useMemo, useRef } from 'react'

import { theme } from '../../config/theme'
import { useRegisterFocusTarget } from '../../hooks/useRegisterFocusTarget'
import { getHelpBindingGroups, makeHelpBindings } from '../../keymap/bindings'
import { keymapPriority } from '../../keymap/priorities'
import { selectIsHelpOpen, tuiStore, useTuiStore } from '../../store'

type HelpRow = {
  group: string
  key: string
  title: string
}

export function HelpModal() {
  const focusRef = useRef<BoxRenderable | null>(null)
  const scrollboxRef = useRef<ScrollBoxRenderable | null>(null)
  const keymap = useKeymap()
  const { height, width } = useTerminalDimensions()
  const isOpen = useTuiStore(selectIsHelpOpen)
  const padding = width < 90 ? 0 : 1
  const modalWidth = Math.max(40, Math.min(width - 8, 72))
  const modalHeight = Math.max(10, Math.min(height - 6, 28))
  const bodyHeight = Math.max(4, modalHeight - 4 - padding * 2)
  const rows = useMemo(() => makeHelpRows(keymap), [keymap])

  useRegisterFocusTarget('help', isOpen ? focusRef : null)

  useBindings(
    () =>
      isOpen
        ? {
            priority: keymapPriority.modal,
            bindings: makeHelpBindings({
              onClose: () => tuiStore.getState().closeHelpModal(),
              onPageDown: () =>
                scrollboxRef.current?.scrollBy(
                  Math.max(1, Math.floor(bodyHeight / 2)),
                  'step',
                ),
              onPageUp: () =>
                scrollboxRef.current?.scrollBy(
                  -Math.max(1, Math.floor(bodyHeight / 2)),
                  'step',
                ),
              onScrollDown: () => scrollboxRef.current?.scrollBy(1, 'step'),
              onScrollUp: () => scrollboxRef.current?.scrollBy(-1, 'step'),
            }),
          }
        : { bindings: [] },
    [bodyHeight, isOpen],
  )

  if (!isOpen) {
    return null
  }

  return (
    <box
      height="100%"
      left={0}
      onMouseUp={() => tuiStore.getState().closeHelpModal()}
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
        ref={focusRef}
        style={{ backgroundColor: theme.panel }}
        height={modalHeight}
        width={modalWidth}
      >
        <box marginBottom={1} paddingLeft={1} paddingRight={1} width="100%">
          <text>
            <strong fg={theme.text}>Keyboard Help</strong>
          </text>
        </box>
        <scrollbox
          paddingLeft={1}
          paddingRight={1}
          ref={scrollboxRef}
          style={{ height: bodyHeight }}
          width="100%"
        >
          {rows.map((row, index) => {
            const previous = rows[index - 1]
            const showGroup = !previous || previous.group !== row.group

            return (
              <box
                key={`${row.group}:${row.key}:${row.title}`}
                flexDirection="column"
              >
                {showGroup ? (
                  <box marginTop={index === 0 ? 0 : 1} width="100%">
                    <text fg={theme.accent}>{row.group}</text>
                  </box>
                ) : null}
                <box flexDirection="row" width="100%">
                  <box width={16}>
                    <text fg={theme.active}>{row.key}</text>
                  </box>
                  <text fg={theme.text}>{row.title}</text>
                </box>
              </box>
            )
          })}
        </scrollbox>
      </box>
    </box>
  )
}

function makeHelpRows(
  keymap: ReturnType<typeof useKeymap>,
): readonly HelpRow[] {
  const seen = new Set<string>()
  const rows: HelpRow[] = []

  for (const bindings of getHelpBindingGroups()) {
    for (const binding of bindings) {
      const row = {
        group: binding.group,
        key: keymap.formatKey(binding.key, { preferDisplay: true }),
        title: binding.desc,
      }
      const key = `${row.group}:${row.key}:${row.title}`

      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      rows.push(row)
    }
  }

  return rows.sort((a, b) =>
    a.group === b.group
      ? a.title.localeCompare(b.title)
      : groupOrder(a.group) - groupOrder(b.group) ||
        a.group.localeCompare(b.group),
  )
}

function groupOrder(group: string) {
  return group === 'Global'
    ? 0
    : group === 'Search'
      ? 1
      : group === 'Active'
        ? 2
        : group === 'Browse'
          ? 3
          : group === 'Action modal'
            ? 4
            : group === 'Window picker'
              ? 5
              : group === 'Create workspace'
                ? 6
                : group === 'Help'
                  ? 7
                  : 8
}
