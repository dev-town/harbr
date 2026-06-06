export type ListState = {
  hoveredId: string | null
  query: string
  selectedId: string | null
}

export function createListState(): ListState {
  return {
    hoveredId: null,
    query: '',
    selectedId: null,
  }
}
