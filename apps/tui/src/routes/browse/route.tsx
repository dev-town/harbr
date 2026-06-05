import { ResultsList } from '../../components/results-list'
import { SearchBar } from '../../components/search-bar'
import { BrowseRouteLayout } from './layout'
import { BrowseRouteRow } from './components/row'
import { useBrowseRoute } from './hooks/use-browse-route'
import { ActionsModal } from './components/actions-modal'
import { CreateWorkspaceModal } from './components/create-workspace-modal'

export function BrowseRoute() {
  const browseRoute = useBrowseRoute()

  return (
    <BrowseRouteLayout
      search={
        <SearchBar
          focused={browseRoute.searchFocused}
          inputRef={browseRoute.searchRef}
          onChange={browseRoute.onSearchChange}
          onSubmit={() => browseRoute.selectedRow && browseRoute.onOpenRow(browseRoute.selectedRow)}
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
          />
        )}
        rows={browseRoute.rows}
        selectedId={browseRoute.selectedId}
      />
      <ActionsModal />
      <CreateWorkspaceModal />
    </BrowseRouteLayout>
  )
}
