import { useBindings } from '@opentui/keymap/react'
import { useTerminalDimensions } from '@opentui/react'

import { loadProjects } from '../../../actions/refresh'
import { makeBrowseBindings } from '../../../keymap/bindings'
import { keymapPriority } from '../../../keymap/priorities'
import { handleBrowseRouteBack, handleBrowseRouteSelect } from '../actions'
import { useTuiServices } from '../../../hooks/useTuiServices'
import { selectSelectedBrowseRow, tuiStore, useTuiStore } from '../../../store'

export function useBrowseKeybindings() {
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
            bindings: makeBrowseBindings({
              interactionMode,
              onActions: () => tuiStore.getState().openBrowseActionsMenu(),
              onBack: () => handleBrowseRouteBack(tuiStore),
              onEnterInputMode: () => tuiStore.getState().enterInputMode(),
              onExitInputMode: () => tuiStore.getState().exitInputMode(),
              onMoveDown: () => tuiStore.getState().moveBrowseSelection(1),
              onMoveUp: () => tuiStore.getState().moveBrowseSelection(-1),
              onNextRoute: () => tuiStore.getState().nextRoute(),
              onPageDown: () => tuiStore.getState().moveBrowseSelection(pageDelta),
              onPageUp: () => tuiStore.getState().moveBrowseSelection(-pageDelta),
              onPreviousRoute: () => tuiStore.getState().previousRoute(),
              onRefresh: () => void loadProjects(services, tuiStore),
              onSelect: () =>
                handleBrowseRouteSelect(
                  services,
                  tuiStore,
                  selectSelectedBrowseRow(tuiStore.getState()),
                ),
              onToggleVisibility: () => tuiStore.getState().toggleBrowseVisibility(),
            }),
          }
        : { bindings: [] },
    [interactionMode, pageDelta, services, surfaceKind],
  )
}
