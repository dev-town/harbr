import type { InputRenderable } from '@opentui/core'
import { useBindings } from '@opentui/keymap/react'
import type { RefObject } from 'react'

import { loadProjects } from '../../../actions/refresh'
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
      bindings: [
        { key: 'up', cmd: () => tuiStore.getState().moveActiveSelection(-1) },
        { key: 'down', cmd: () => tuiStore.getState().moveActiveSelection(1) },
        {
          key: 'return',
          cmd: () => handleActiveRouteSelect(services, tuiStore),
        },
        { key: 'escape', cmd: () => handleActiveRouteBack(services, tuiStore) },
        { key: 'tab', cmd: () => tuiStore.getState().nextRoute() },
        { key: 'shift+tab', cmd: () => tuiStore.getState().previousRoute() },
        { key: 'ctrl+r', cmd: () => void loadProjects(services, tuiStore) },
        {
          key: 'ctrl+a',
          cmd: () => tuiStore.getState().openActiveActionsMenu(),
        },
      ],
    }),
    [searchRef, services],
  )
}
