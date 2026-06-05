import { useAtomValue, useSetAtom } from 'jotai'

import { currentRouteAtom, setCurrentRouteAtom } from '../../state'
import type { AppRoute } from '../../types/navigation'

export function useShell() {
  const setCurrentRoute = useSetAtom(setCurrentRouteAtom)
  const currentRoute = useAtomValue(currentRouteAtom)

  return {
    currentRoute,
    onRouteSelect: (route: AppRoute) => setCurrentRoute(route),
  }
}
