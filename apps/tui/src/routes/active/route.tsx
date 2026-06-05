import { ResultsList } from '../../components/results-list'
import { SearchBar } from '../../components/search-bar'
import { ActiveRouteLayout } from './layout'
import { ActiveRouteRow } from './components/row'
import { useActiveRoute } from './hooks/use-active-route'

export function ActiveRoute() {
  const activeRoute = useActiveRoute()

  return (
    <ActiveRouteLayout
      search={
        <SearchBar
          focused
          inputRef={activeRoute.searchRef}
          onChange={activeRoute.onSearchChange}
          onSubmit={() =>
            activeRoute.selectedRow &&
            activeRoute.onOpenRow(activeRoute.selectedRow)
          }
          placeholder={activeRoute.placeholder}
          value={activeRoute.query}
        />
      }
    >
      <ResultsList
        emptyLabel="No active sessions match current filters"
        hoveredId={activeRoute.hoveredId}
        isLoading={activeRoute.isLoading}
        renderRow={(row, state) => (
          <ActiveRouteRow
            isHovered={state.isHovered}
            isSelected={state.isSelected}
            onRowClick={() => activeRoute.onOpenRow(row)}
            onRowHover={activeRoute.onHoverRow}
            row={row}
          />
        )}
        rows={activeRoute.rows}
        selectedId={activeRoute.selectedId}
      />
    </ActiveRouteLayout>
  )
}
