import type { InputRenderable } from '@opentui/core'
import { useBindings } from '@opentui/keymap/react'
import type { RefObject } from 'react'

import { loadProjects } from '../../../actions/refresh'
import { makeActiveBindings } from '../../../keymap/bindings'
import { keymapPriority } from '../../../keymap/priorities'
import { handleActiveRouteBack, handleActiveRouteSelect } from '../actions'
import { useTuiServices } from '../../../hooks/useTuiServices'
import { tuiStore } from '../../../store'

export function useActiveKeybindings(
  searchRef: RefObject<InputRenderable | null>,
) {
  const services = useTuiServices()

  useBindings(
    () => ({
      targetRef: searchRef,
      targetMode: 'focus-within',
      priority: keymapPriority.route,
      bindings: makeActiveBindings({
        onActions: () => tuiStore.getState().openActiveActionsMenu(),
        onBack: () => handleActiveRouteBack(services, tuiStore),
        onMoveDown: () => tuiStore.getState().moveActiveSelection(1),
        onMoveUp: () => tuiStore.getState().moveActiveSelection(-1),
        onNextRoute: () => tuiStore.getState().nextRoute(),
        onPreviousRoute: () => tuiStore.getState().previousRoute(),
        onRefresh: () => void loadProjects(services, tuiStore),
        onSelect: () => handleActiveRouteSelect(services, tuiStore),
      }),
    }),
    [searchRef, services],
  )
}
