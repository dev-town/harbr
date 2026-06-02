import { useAtomValue, useStore } from 'jotai'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import { useTuiServices } from '../hooks/useTuiServices'
import type { FocusTargetRef, SurfaceId } from '../state'
import {
  actionsFocusTargetRefAtom,
  activeFocusTargetAtom,
  browserFocusTargetRefAtom,
  worktreeFormFocusTargetRefAtom,
} from '../state'

export function Surface({
  active,
  children,
  focusTargetRef,
  id,
}: {
  active: boolean
  children?: ReactNode
  focusTargetRef?: FocusTargetRef
  id: SurfaceId
}) {
  const store = useStore()

  useEffect(() => {
    const focusTargetAtom =
      id === 'actions'
        ? actionsFocusTargetRefAtom
        : id === 'worktree-form'
          ? worktreeFormFocusTargetRefAtom
          : browserFocusTargetRefAtom

    if (!active) {
      store.set(focusTargetAtom, null)
      return
    }

    store.set(focusTargetAtom, focusTargetRef ?? null)

    return () => {
      store.set(focusTargetAtom, null)
    }
  }, [active, focusTargetRef, id, store])

  return active ? <>{children}</> : null
}

export function SurfaceFocusManager() {
  const services = useTuiServices()
  const activeFocusTarget = useAtomValue(activeFocusTargetAtom)
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
