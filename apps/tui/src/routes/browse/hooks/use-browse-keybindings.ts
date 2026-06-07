import type { InputRenderable } from '@opentui/core'
import { useBindings } from '@opentui/keymap/react'
import type { RefObject } from 'react'

import { loadProjects } from '../../../actions/refresh'
import { makeBrowseBindings } from '../../../keymap/bindings'
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
      bindings: makeBrowseBindings({
        onActions: () => tuiStore.getState().openBrowseActionsMenu(),
        onBack: () => handleBrowseRouteBack(services, tuiStore),
        onMoveDown: () => tuiStore.getState().moveBrowseSelection(1),
        onMoveUp: () => tuiStore.getState().moveBrowseSelection(-1),
        onNextRoute: () => tuiStore.getState().nextRoute(),
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
    }),
    [searchRef, services],
  )
}
