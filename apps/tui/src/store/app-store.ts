import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

import { createActiveActions } from './active/active-actions'
import { createActiveState } from './active/active-state'
import { createAppActions } from './app/app-actions'
import { createAppState } from './app/app-state'
import { createBrowseActions } from './browse/browse-actions'
import { createBrowseState } from './browse/browse-state'
import { createDataState } from './data/data-state'
import { createSurfacesActions } from './surfaces/surfaces-actions'
import { createSurfacesState } from './surfaces/surfaces-state'
import type { TuiStoreModel } from './types'
import { createWorktreeFormActions } from './worktree-form/worktree-form-actions'
import { createWorktreeFormState } from './worktree-form/worktree-form-state'

export const tuiStore = createStore<TuiStoreModel>()((set, get) => ({
  active: createActiveState(),
  app: createAppState(),
  browse: createBrowseState(),
  data: createDataState(),
  surfaces: createSurfacesState(),
  worktreeForm: createWorktreeFormState(),

  ...createActiveActions(set, get),
  ...createAppActions(set, get),
  ...createBrowseActions(set, get),
  ...createSurfacesActions(set, get),
  ...createWorktreeFormActions(set, get),
}))

export function useTuiStore<T>(selector: (state: TuiStoreModel) => T) {
  return useStore(tuiStore, selector)
}
