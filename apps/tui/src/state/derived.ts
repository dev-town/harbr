import { atom } from 'jotai'

import { activeQueryAtom, selectedActiveRowIdAtom, visibleActiveRowsAtom } from '../routes/active'
import {
  actionRowsAtom,
  browseBreadcrumbAtom,
  browseQueryAtom,
  browseSectionAtom,
  browseVisibilityAtom,
  isActionsOpenAtom,
  selectedActionRowIdAtom,
  selectedBrowseRowIdAtom,
  selectedProjectIssueAtom as browseSelectedProjectIssueAtom,
  visibleBrowseRowsAtom,
} from '../routes/browse'
import { currentRouteAtom } from './app'

export const currentRowCountAtom = atom((get) => {
  if (get(isActionsOpenAtom)) {
    return get(actionRowsAtom).length
  }

  return get(currentRouteAtom) === 'active'
    ? get(visibleActiveRowsAtom).length
    : get(visibleBrowseRowsAtom).length
})

export const currentSelectedRowIdAtom = atom((get) => {
  if (get(isActionsOpenAtom)) {
    return get(selectedActionRowIdAtom)
  }

  return get(currentRouteAtom) === 'active'
    ? get(selectedActiveRowIdAtom)
    : get(selectedBrowseRowIdAtom)
})

export const effectiveVisibilityAtom = atom((get) => {
  if (get(isActionsOpenAtom) || get(currentRouteAtom) === 'active') {
    return 'all'
  }

  const visibility = get(browseVisibilityAtom)
  const rows = get(visibleBrowseRowsAtom)

  if (visibility === 'all') {
    return visibility
  }

  return rows.some((row) => row.isActive) ? 'active' : 'all'
})

export const footerHintsAtom = atom((get) => {
  const currentRoute = get(currentRouteAtom)
  const currentSection = get(browseSectionAtom)
  const activeQuery = get(activeQueryAtom)
  const browseQuery = get(browseQueryAtom)

  if (get(isActionsOpenAtom)) {
    return [
      { key: '↑↓', label: 'move' },
      { key: 'Enter', label: 'run action' },
      { key: 'Esc', label: 'close' },
    ]
  }

  if (currentRoute === 'active') {
    return [
      { key: 'Enter', label: 'switch' },
      { key: 'Tab', label: 'next tab' },
      { key: 'Shift+Tab', label: 'prev tab' },
      { key: 'Esc', label: activeQuery.length > 0 ? 'clear query' : 'close' },
    ]
  }

  if (browseQuery.length > 0) {
    return [
      { key: 'Enter', label: 'drill next' },
      { key: 'Ctrl+A', label: 'actions' },
      { key: 'Ctrl+F', label: 'active/all' },
      { key: 'Esc', label: 'clear query' },
    ]
  }

  if (currentSection === 'workspaces') {
    return [
      { key: 'Enter', label: 'drill next' },
      { key: 'Ctrl+A', label: 'actions' },
      { key: 'Ctrl+F', label: 'active/all' },
      { key: 'Esc', label: 'back' },
    ]
  }

  if (currentSection === 'modules') {
    return [
      { key: 'Enter', label: 'attach/create' },
      { key: 'Ctrl+A', label: 'actions' },
      { key: 'Ctrl+F', label: 'active/all' },
      { key: 'Esc', label: 'back' },
    ]
  }

  return [
    { key: 'Enter', label: 'drill next' },
    { key: 'Ctrl+A', label: 'actions' },
    { key: 'Ctrl+F', label: 'active/all' },
    { key: 'Esc', label: 'close' },
  ]
})

export const breadcrumbAtom = atom((get) => get(browseBreadcrumbAtom))

export const selectedProjectIssueAtom = atom((get) => get(browseSelectedProjectIssueAtom))
