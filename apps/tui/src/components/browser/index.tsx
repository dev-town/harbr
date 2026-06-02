import type { InputRenderable } from '@opentui/core'
import { useRef } from 'react'

import { theme } from '../../config/theme'
import { useBrowserSurface } from '../../hooks/useBrowserSurface'
import { Surface } from '../../keymap/layers'
import { ActionsModal } from '../actions-modal'
import { CreateWorkspaceModal } from '../create-workspace-modal'
import { ListHeader } from '../list-header'
import { ResultsList } from '../results-list'
import { SearchBar } from '../search-bar'

export function Browser() {
  const { browseRows, isActionsOpen, onActionSelect, onBrowseSelect } = useBrowserSurface()
  const browseSearchRef = useRef<InputRenderable | null>(null)

  return (
    <Surface active focusTargetRef={browseSearchRef} id="browser">
      <box
        border
        borderColor={theme.border}
        borderStyle="single"
        flexDirection="column"
        height="100%"
        padding={1}
        style={{ backgroundColor: theme.panel }}
        width="100%"
      >
        <box flexDirection="column" flexGrow={1} style={{ backgroundColor: theme.panel }} width="100%">
          <SearchBar
            focused={!isActionsOpen}
            inputRef={browseSearchRef}
            onSubmit={onBrowseSelect}
          />
          <box flexDirection="column" flexGrow={1} marginTop={1} width="100%">
            <ListHeader />
            <ResultsList onRowSelect={onBrowseSelect} rows={browseRows} />
          </box>
        </box>
        <ActionsModal onSelectAction={onActionSelect} />
        <CreateWorkspaceModal />
      </box>
    </Surface>
  )
}
