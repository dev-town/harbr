import { atom } from 'jotai'

import type { AppRoute } from '../types/navigation'
import { activeSearchFocusNonceAtom } from '../routes/active/atoms'
import {
  browseSearchFocusNonceAtom,
  closeActionsMenuAtom,
  closeWorktreeFormAtom,
} from '../routes/browse'
import { currentRouteAtom, noticeAtom } from './app'

const orderedRoutes: readonly AppRoute[] = ['active', 'browse']

export const clearNoticeAtom = atom(null, (_get, set) => {
  set(noticeAtom, null)
})

export const setCurrentRouteAtom = atom(null, (_get, set, nextRoute: AppRoute) => {
  set(currentRouteAtom, nextRoute)
  set(closeActionsMenuAtom)
  set(closeWorktreeFormAtom)
  set(noticeAtom, null)

  if (nextRoute === 'active') {
    set(activeSearchFocusNonceAtom, (current) => current + 1)
    return
  }

  set(browseSearchFocusNonceAtom, (current) => current + 1)
})

export const nextRouteAtom = atom(null, (get, set) => {
  const currentIndex = orderedRoutes.indexOf(get(currentRouteAtom))
  const nextRoute = orderedRoutes[(currentIndex + 1) % orderedRoutes.length] ?? 'browse'

  set(setCurrentRouteAtom, nextRoute)
})

export const previousRouteAtom = atom(null, (get, set) => {
  const currentIndex = orderedRoutes.indexOf(get(currentRouteAtom))
  const nextRoute =
    orderedRoutes[(currentIndex - 1 + orderedRoutes.length) % orderedRoutes.length] ?? 'browse'

  set(setCurrentRouteAtom, nextRoute)
})
