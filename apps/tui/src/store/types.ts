import type { ResolvedContextTarget } from '@harbr/domain'
import type { StoreApi } from 'zustand/vanilla'

import type { AppState } from './app/app-state'
import type { ActiveState } from './active/active-state'
import type { BrowseState } from './browse/browse-state'
import type { DataState } from './data/data-state'
import type {
  FocusTargetRef,
  SurfaceId,
  SurfacesState,
} from './surfaces/surfaces-state'
import type { WorktreeFormState } from './worktree-form/worktree-form-state'
import type { AppRoute, VisibilityFilter } from '~/types/navigation'
import type { NoticeLevel } from '~/types/notice'

export type TuiStoreState = {
  active: ActiveState
  app: AppState
  browse: BrowseState
  data: DataState
  surfaces: SurfacesState
  worktreeForm: WorktreeFormState
}

export type TuiStoreActions = {
  backWorktreeForm(): void
  changeActiveQuery(value: string): void
  changeBrowseQuery(value: string): void
  clearNotice(): void
  closeActionsMenu(): void
  closeHelpModal(): void
  closeWindowPicker(): void
  closeWorktreeForm(): void
  enterInputMode(): void
  exitInputMode(): void
  hoverActiveRow(rowId: string | null): void
  hoverBrowseRow(rowId: string | null): void
  moveActiveSelection(delta: number): void
  moveBrowseSelection(delta: number): void
  openActiveActionsMenu(): void
  openBrowseActionsMenu(): void
  openCreateWorkspaceForm(projectId: string): void
  openHelpModal(): void
  openWindowPicker(target: ResolvedContextTarget, contextLabel?: string): void
  previousRoute(): void
  registerFocusTarget(id: SurfaceId, ref: FocusTargetRef | null): void
  resetActiveQuery(): void
  resetActiveSelection(): void
  resetBrowseQuery(): void
  resetBrowseSelection(): void
  resetProjectScope(): void
  resetWorkspaceScope(): void
  selectActiveRow(rowId: string): void
  selectBrowseRow(rowId: string): void
  setCurrentRoute(route: AppRoute): void
  setLoading(isLoading: boolean): void
  setNotice(notice: string | null, level?: NoticeLevel): void
  toggleBrowseVisibility(): void
  nextRoute(): void
  setBrowseVisibility(visibility: VisibilityFilter): void
}

export type TuiStoreModel = TuiStoreState & TuiStoreActions

export type TuiStoreGet = StoreApi<TuiStoreModel>['getState']
export type TuiStoreSet = StoreApi<TuiStoreModel>['setState']
