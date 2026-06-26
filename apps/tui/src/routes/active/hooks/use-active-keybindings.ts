import { useBindings } from '@opentui/keymap/react'
import { useTerminalDimensions } from '@opentui/react'

import { loadProjects } from '~/actions/refresh'
import { makeActiveBindings } from '~/keymap/bindings'
import { keymapPriority } from '~/keymap/priorities'
import {
  handleActiveRouteBack,
  handleActiveRouteSelect,
} from '~/routes/active/actions'
import { useTuiServices } from '~/hooks/useTuiServices'
import { tuiStore, useTuiStore } from '~/store'

export function useActiveKeybindings() {
  const services = useTuiServices()
  const { height } = useTerminalDimensions()
  const interactionMode = useTuiStore((state) => state.surfaces.interactionMode)
  const surfaceKind = useTuiStore((state) => state.surfaces.surface.kind)
  const pageDelta = Math.max(1, Math.floor(height / 2))

  useBindings(
    () =>
      surfaceKind === 'browser'
        ? {
            priority: keymapPriority.route,
            bindings: makeActiveBindings({
              interactionMode,
              onActions: () => tuiStore.getState().openActiveActionsMenu(),
              onBack: () => handleActiveRouteBack(tuiStore),
              onEnterInputMode: () => tuiStore.getState().enterInputMode(),
              onExitInputMode: () => tuiStore.getState().exitInputMode(),
              onMoveDown: () => tuiStore.getState().moveActiveSelection(1),
              onMoveUp: () => tuiStore.getState().moveActiveSelection(-1),
              onNextRoute: () => tuiStore.getState().nextRoute(),
              onPageDown: () =>
                tuiStore.getState().moveActiveSelection(pageDelta),
              onPageUp: () =>
                tuiStore.getState().moveActiveSelection(-pageDelta),
              onPreviousRoute: () => tuiStore.getState().previousRoute(),
              onRefresh: () => void loadProjects(services, tuiStore),
              onSelect: () => handleActiveRouteSelect(services, tuiStore),
            }),
          }
        : { bindings: [] },
    [interactionMode, pageDelta, services, surfaceKind],
  )
}
