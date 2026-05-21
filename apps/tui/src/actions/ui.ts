import type { TuiAppContext } from '../app-context'
import { clampIndex } from '../helpers/selection'
import {
  focusSearchNonceAtom,
  hoveredIndexAtom,
  noticeAtom,
  queryAtom,
  selectedIndexAtom,
} from '../state'

import { handleSelect, loadProjects } from './index'

export function handleQueryChange(context: TuiAppContext, value: string) {
  context.store.set(queryAtom, value)
  context.store.set(selectedIndexAtom, 0)
  context.store.set(noticeAtom, null)
}

export function handleQuerySubmit(context: TuiAppContext) {
  handleSelect(context)
}

export function handleRowClick(context: TuiAppContext, index: number) {
  context.store.set(selectedIndexAtom, index)
  context.store.set(focusSearchNonceAtom, (current) => current + 1)
  handleSelect(context)
}

export function handleRowHover(context: TuiAppContext, index: number | null) {
  context.store.set(hoveredIndexAtom, index)
}

export function clampSelectedIndex(context: TuiAppContext, rowCount: number) {
  context.store.set(selectedIndexAtom, (current) => clampIndex(current, rowCount))
}

export async function loadInitialProjects(context: TuiAppContext) {
  await loadProjects(context)
}
