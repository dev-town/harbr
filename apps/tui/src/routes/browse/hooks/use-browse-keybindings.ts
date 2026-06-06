import type { InputRenderable } from '@opentui/core'
import { useBindings } from '@opentui/keymap/react'
import type { RefObject } from 'react'

import { loadProjects } from '../../../actions/refresh'
import { keymapPriority } from '../../../keymap/priorities'
import { handleBrowseRouteBack, handleBrowseRouteSelect } from '../actions'
import { useTuiServices } from '../../../hooks/useTuiServices'
import { selectSelectedBrowseRow, tuiStore } from '../../../store'

export function useBrowseKeybindings(
  searchRef: RefObject<InputRenderable | null>,
) {
  const services = useTuiServices()

  useBindings(
    () => ({
      targetRef: searchRef,
      targetMode: 'focus-within',
      priority: keymapPriority.route,
      bindings: [
        { key: 'up', cmd: () => tuiStore.getState().moveBrowseSelection(-1) },
        { key: 'down', cmd: () => tuiStore.getState().moveBrowseSelection(1) },
        {
          key: 'return',
          cmd: () =>
            handleBrowseRouteSelect(
              services,
              tuiStore,
              selectSelectedBrowseRow(tuiStore.getState()),
            ),
        },
        { key: 'escape', cmd: () => handleBrowseRouteBack(services, tuiStore) },
        { key: 'tab', cmd: () => tuiStore.getState().nextRoute() },
        { key: 'shift+tab', cmd: () => tuiStore.getState().previousRoute() },
        { key: 'ctrl+r', cmd: () => void loadProjects(services, tuiStore) },
        {
          key: 'ctrl+f',
          cmd: () => tuiStore.getState().toggleBrowseVisibility(),
        },
        {
          key: 'ctrl+a',
          cmd: () => tuiStore.getState().openBrowseActionsMenu(),
        },
      ],
    }),
    [searchRef, services],
  )
}
