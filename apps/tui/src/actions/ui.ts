import type { TuiAppContext } from '../app-context'
import { clampIndex } from '../helpers/selection'
import {
  actionSelectedIndexAtom,
  actionsOpenAtom,
  focusSearchNonceAtom,
  hoveredIndexAtom,
  noticeAtom,
  queryAtom,
  selectedIndexAtom,
} from '../state'

import { handleBrowseSelect, loadProjects } from './index'

export function handleQueryChange(context: TuiAppContext, value: string) {
  context.store.set(queryAtom, value)

  if (!context.store.get(actionsOpenAtom)) {
    context.store.set(selectedIndexAtom, 0)
  }

  context.store.set(noticeAtom, null)
}

export function handleQuerySubmit(context: TuiAppContext) {
  handleBrowseSelect(context)
}

export function handleRowClick(context: TuiAppContext, index: number) {
  context.store.set(selectedIndexAtom, index)
  context.store.set(focusSearchNonceAtom, (current) => current + 1)
  handleBrowseSelect(context)
}

export function handleRowHover(context: TuiAppContext, index: number | null) {
  context.store.set(hoveredIndexAtom, index)
}

export function clampSelectedIndex(context: TuiAppContext, rowCount: number) {
  if (context.store.get(actionsOpenAtom)) {
    context.store.set(actionSelectedIndexAtom, (current) => clampIndex(current, rowCount))
    return
  }

  context.store.set(selectedIndexAtom, (current) => clampIndex(current, rowCount))
}

export async function loadInitialProjects(context: TuiAppContext) {
  await loadProjects(context)
}
