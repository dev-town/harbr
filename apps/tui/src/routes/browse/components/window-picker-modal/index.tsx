import type { BoxRenderable } from '@opentui/core'
import { RGBA } from '@opentui/core'
import { useBindings } from '@opentui/keymap/react'
import { useTerminalDimensions } from '@opentui/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { createWindowsForContext } from '../../../../actions/windows'
import { theme } from '../../../../config/theme'
import { useRegisterFocusTarget } from '../../../../hooks/useRegisterFocusTarget'
import { useTuiServices } from '../../../../hooks/useTuiServices'
import { keymapPriority } from '../../../../keymap/priorities'
import {
  selectIsWindowPickerOpen,
  tuiStore,
  useTuiStore,
} from '../../../../store'

export function WindowPickerModal() {
  const focusRef = useRef<BoxRenderable | null>(null)
  const services = useTuiServices()
  const { width } = useTerminalDimensions()
  const isOpen = useTuiStore(selectIsWindowPickerOpen)
  const surface = useTuiStore((state) => state.surfaces.surface)
  const projectWindows = useTuiStore((state) => state.data.projectWindows)
  const picker = useMemo(
    () =>
      surface.kind === 'window-picker'
        ? resolvePickerState({
            ...(surface.contextLabel
              ? { contextLabel: surface.contextLabel }
              : {}),
            projectWindows,
            target: surface.target,
          })
        : null,
    [projectWindows, surface],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedNames, setSelectedNames] = useState<readonly string[]>([])
  const modalWidth = getModalWidth(width, 60)
  const padding = width < 90 ? 0 : 1

  useRegisterFocusTarget('window-picker', isOpen ? focusRef : null)

  useEffect(() => {
    if (!isOpen || !picker) {
      setSelectedId(null)
      setSelectedNames([])
      return
    }

    setSelectedId(picker.windows[0]?.name ?? null)
    setSelectedNames(picker.windows.map((window) => window.name))
  }, [isOpen, picker])

  const moveSelection = (delta: number) => {
    if (!picker || picker.windows.length === 0) {
      return
    }

    const currentIndex = selectedId
      ? picker.windows.findIndex((window) => window.name === selectedId)
      : 0
    const nextIndex = Math.max(
      0,
      Math.min(
        picker.windows.length - 1,
        (currentIndex >= 0 ? currentIndex : 0) + delta,
      ),
    )

    setSelectedId(picker.windows[nextIndex]?.name ?? null)
  }

  const toggleSelected = (windowName = selectedId) => {
    if (!windowName) {
      return
    }

    setSelectedNames((current) =>
      current.includes(windowName)
        ? current.filter((name) => name !== windowName)
        : [...current, windowName],
    )
  }

  const confirmSelection = () => {
    if (!picker || selectedNames.length === 0) {
      tuiStore.getState().setNotice('Select at least one window', 'warning')
      return
    }

    const selectedWindows = picker.windows.filter((window) =>
      selectedNames.includes(window.name),
    )

    void createWindowsForContext(
      services,
      tuiStore,
      picker.target,
      selectedWindows,
    )
  }

  useBindings(
    () =>
      isOpen
        ? {
            priority: keymapPriority.modal,
            bindings: [
              { key: 'up', cmd: () => moveSelection(-1) },
              { key: 'down', cmd: () => moveSelection(1) },
              { key: 'space', cmd: () => toggleSelected() },
              { key: 'return', cmd: confirmSelection },
              {
                key: 'escape',
                cmd: () => tuiStore.getState().closeWindowPicker(),
              },
            ],
          }
        : { bindings: [] },
    [confirmSelection, isOpen, moveSelection, selectedId, toggleSelected],
  )

  if (!isOpen || !picker) {
    return null
  }

  return (
    <box
      height="100%"
      left={0}
      onMouseUp={() => tuiStore.getState().closeWindowPicker()}
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
            <strong fg={theme.text}>{`Create ${picker.scope} windows`}</strong>
          </text>
          <text fg={theme.muted}>{picker.contextLabel}</text>
        </box>
        <box flexDirection="column" width="100%">
          {picker.windows.map((window) => {
            const isSelected = selectedId === window.name
            const isChecked = selectedNames.includes(window.name)

            return (
              <box
                key={window.name}
                onMouseDown={() => {
                  setSelectedId(window.name)
                  toggleSelected(window.name)
                }}
                paddingLeft={1}
                paddingRight={1}
                style={{
                  backgroundColor: isSelected ? theme.selection : theme.panel,
                }}
                width="100%"
              >
                <text>
                  <span fg={isSelected ? theme.accent : theme.muted}>
                    {isSelected ? '›' : ' '}
                  </span>
                  <span fg={theme.text}> {isChecked ? '[x]' : '[ ]'} </span>
                  <span fg={isSelected ? theme.activeText : theme.text}>
                    {window.name}
                  </span>
                  <span
                    fg={theme.muted}
                  >{` · ${formatPaneCount(window.panes.length)}`}</span>
                </text>
              </box>
            )
          })}
        </box>
        <box marginTop={1} paddingLeft={1} width="100%">
          <text fg={theme.muted}>Space toggle · Enter create · Esc back</text>
        </box>
      </box>
    </box>
  )
}

function resolvePickerState(input: {
  contextLabel?: string
  projectWindows: ReturnType<typeof tuiStore.getState>['data']['projectWindows']
  target: Exclude<
    ReturnType<typeof tuiStore.getState>['surfaces']['surface'],
    { kind: 'browser' | 'actions' | 'worktree-form' }
  >['target']
}) {
  const windows =
    input.projectWindows.find(
      (entry) => entry.projectId === input.target.context.projectId,
    )?.windows ?? []
  const contextLabel = input.contextLabel ?? input.target.breadcrumb

  return {
    contextLabel,
    scope: input.target.scope,
    target: input.target,
    windows,
  }
}

function formatPaneCount(count: number) {
  return count === 1 ? '1 pane' : `${count} panes`
}

function getModalWidth(width: number, maxWidth: number) {
  return Math.max(40, Math.min(maxWidth, width - (width < 90 ? 4 : 8)))
}
