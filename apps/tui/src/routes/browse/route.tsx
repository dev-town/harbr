import { useTerminalDimensions } from '@opentui/react'

import { getRowVariant } from '~/components/list-row/utils'
import { ResultsList } from '~/components/results-list'
import { SearchBar } from '~/components/search-bar'
import { BrowseRouteLayout } from './layout'
import { BrowseActionsModal } from './components/actions-modal'
import { BrowseRouteRow } from './components/row'
import { useBrowseRoute } from './hooks/use-browse-route'
import { CreateWorkspaceModal } from './components/create-workspace-modal'
import { WindowPickerModal } from './components/window-picker-modal'

export function BrowseRoute() {
  const browseRoute = useBrowseRoute()
  const { width } = useTerminalDimensions()
  const rowVariant = getRowVariant(width)

  return (
    <BrowseRouteLayout
      search={
        <SearchBar
          focused={browseRoute.searchFocused}
          inputRef={browseRoute.searchRef}
          onChange={browseRoute.onSearchChange}
          onSubmit={() =>
            browseRoute.selectedRow &&
            browseRoute.onOpenRow(browseRoute.selectedRow)
          }
          placeholder={browseRoute.placeholder}
          value={browseRoute.query}
        />
      }
    >
      <ResultsList
        hoveredId={browseRoute.hoveredId}
        isLoading={browseRoute.isLoading}
        renderRow={(row, state) => (
          <BrowseRouteRow
            isHovered={state.isHovered}
            isSelected={state.isSelected}
            onRowClick={() => browseRoute.onOpenRow(row)}
            onRowHover={browseRoute.onHoverRow}
            row={row}
            scopeBreadcrumb={browseRoute.breadcrumb}
            variant={rowVariant}
          />
        )}
        rows={browseRoute.rows}
        selectedId={browseRoute.selectedId}
      />
      <BrowseActionsModal />
      <WindowPickerModal />
      <CreateWorkspaceModal />
    </BrowseRouteLayout>
  )
}
