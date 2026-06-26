import { createListState, type ListState } from '~/store/shared/list-state'

export type ActiveState = {
  list: ListState
}

export function createActiveState(): ActiveState {
  return {
    list: createListState(),
  }
}
