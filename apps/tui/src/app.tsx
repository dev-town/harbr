import { harbourCommandIds } from '@harbour/domain'
import { useAtomValue } from 'jotai'
import { useEffect, useRef } from 'react'

import type { TuiAppContext } from './app-context'
import { clampSelectedIndex, closeActionsMenu, focusBrowseSearch, handleActionSelect, handleBrowseBack, handleBrowseSelect, loadInitialProjects, loadProjects, moveActionSelection, moveBrowseSelection, openActionsMenu, toggleBrowseVisibility } from './actions'
import { HarbourPopover } from './components'
import { GlobalLayer, Surface, SurfaceFocusManager } from './keymap/layers'
import { actionRowsAtom, actionsOpenAtom, type FocusTargetRef, visibleBrowseRowsAtom } from './state'

export function App({ context }: { context: TuiAppContext }) {
  const actionRows = useAtomValue(actionRowsAtom)
  const actionsOpen = useAtomValue(actionsOpenAtom)
  const browseRows = useAtomValue(visibleBrowseRowsAtom)
  const actionsFocusRef = useRef<FocusTargetRef['current']>(null)
  const browseSearchRef = useRef<FocusTargetRef['current']>(null)

  useEffect(() => {
    void loadInitialProjects(context)
  }, [context])

  useEffect(() => {
    clampSelectedIndex(context, actionsOpen ? actionRows.length : browseRows.length)
  }, [actionRows.length, actionsOpen, browseRows.length, context])

  return (
    <box flexDirection="column" height="100%" padding={1} width="100%">
      <SurfaceFocusManager />
      <GlobalLayer
        handlers={{
          [harbourCommandIds.appQuit]: () => context.renderer.destroy(),
        }}
      />
      <Surface
        active={!actionsOpen}
        focusTargetRef={browseSearchRef}
        id="browse"
        handlers={{
          [harbourCommandIds.browseUp]: () => moveBrowseSelection(context, -1),
          [harbourCommandIds.browseDown]: () => moveBrowseSelection(context, 1),
          [harbourCommandIds.browseToggleVisibility]: () => toggleBrowseVisibility(context),
          [harbourCommandIds.browseRefresh]: () => void loadProjects(context),
          [harbourCommandIds.browseBack]: () => handleBrowseBack(context),
          [harbourCommandIds.browseSelect]: () => handleBrowseSelect(context),
          [harbourCommandIds.browseOpenActions]: () => openActionsMenu(context),
          [harbourCommandIds.browseFocusSearch]: () => focusBrowseSearch(context),
        }}
      />
      <Surface
        active={actionsOpen}
        focusTargetRef={actionsFocusRef}
        id="actions"
        handlers={{
          [harbourCommandIds.browseUp]: () => moveActionSelection(context, -1),
          [harbourCommandIds.browseDown]: () => moveActionSelection(context, 1),
          [harbourCommandIds.browseSelect]: () => handleActionSelect(context),
          [harbourCommandIds.browseBack]: () => closeActionsMenu(context),
        }}
      />
      <box flexGrow={1}>
        <HarbourPopover actionsFocusRef={actionsFocusRef} browseSearchRef={browseSearchRef} />
      </box>
    </box>
  )
}
