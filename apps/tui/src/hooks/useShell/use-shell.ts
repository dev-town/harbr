import type { AppRoute } from '../../types/navigation'
import { useTuiStore } from '../../store'

export function useShell() {
  const currentRoute = useTuiStore((state) => state.app.currentRoute)
  const setCurrentRoute = useTuiStore((state) => state.setCurrentRoute)

  return {
    currentRoute,
    onRouteSelect: (route: AppRoute) => setCurrentRoute(route),
  }
}
