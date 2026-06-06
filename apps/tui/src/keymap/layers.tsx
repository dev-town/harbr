import { useEffect, useRef } from 'react'

import { useTuiServices } from '../hooks/useTuiServices'
import type { FocusTargetRef } from '../store'
import { selectActiveFocusTarget, useTuiStore } from '../store'

export function SurfaceFocusManager() {
  const services = useTuiServices()
  const activeFocusTarget = useTuiStore(selectActiveFocusTarget)
  const previousTargetRef = useRef<FocusTargetRef['current']>(null)

  useEffect(() => {
    const previousTarget = previousTargetRef.current

    if (previousTarget && !previousTarget.isDestroyed) {
      previousTarget.blur?.()
    } else {
      services.renderer.currentFocusedRenderable?.blur?.()
    }

    const nextTarget = activeFocusTarget
    previousTargetRef.current = nextTarget

    if (!nextTarget || nextTarget.isDestroyed) {
      return
    }

    const timeout = setTimeout(() => {
      if (!nextTarget.isDestroyed) {
        nextTarget.focus?.()
      }
    }, 0)

    return () => {
      clearTimeout(timeout)
    }
  }, [activeFocusTarget, services.renderer])

  return null
}
