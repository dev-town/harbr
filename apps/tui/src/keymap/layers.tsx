import { useAtomValue } from 'jotai'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import { useTuiContext } from '../app-context'
import type { FocusTargetRef, SurfaceHandlers, SurfaceId } from '../state'
import { activeSurfaceAtom, globalHandlersAtom, surfaceStackAtom } from '../state'

export function GlobalLayer({ handlers }: { handlers: SurfaceHandlers }) {
  const context = useTuiContext()
  const tokenRef = useRef<symbol | null>(null)

  if (!tokenRef.current) {
    tokenRef.current = Symbol('global-layer')
  }

  useEffect(() => {
    const token = tokenRef.current!

    context.store.set(globalHandlersAtom, (current) => [
      ...current.filter((entry) => entry.token !== token),
      { token, handlers },
    ])

    return () => {
      context.store.set(globalHandlersAtom, (current) =>
        current.filter((entry) => entry.token !== token),
      )
    }
  }, [context, handlers])

  return null
}

export function Surface({
  active,
  children,
  focusTargetRef,
  handlers,
  id,
}: {
  active: boolean
  children?: ReactNode
  focusTargetRef?: FocusTargetRef
  handlers: SurfaceHandlers
  id: SurfaceId
}) {
  const context = useTuiContext()
  const tokenRef = useRef<symbol | null>(null)

  if (!tokenRef.current) {
    tokenRef.current = Symbol(id)
  }

  useEffect(() => {
    const token = tokenRef.current!

    if (!active) {
      context.store.set(surfaceStackAtom, (current) => current.filter((entry) => entry.token !== token))
      return
    }

    context.store.set(surfaceStackAtom, (current) => [
      ...current.filter((entry) => entry.token !== token),
      {
        token,
        id,
        handlers,
        ...(focusTargetRef ? { focusTargetRef } : {}),
      },
    ])

    return () => {
      context.store.set(surfaceStackAtom, (current) => current.filter((entry) => entry.token !== token))
    }
  }, [active, context, focusTargetRef, handlers, id])

  return active ? <>{children}</> : null
}

export function SurfaceFocusManager() {
  const context = useTuiContext()
  const activeSurface = useAtomValue(activeSurfaceAtom)
  const previousTargetRef = useRef<FocusTargetRef['current']>(null)

  useEffect(() => {
    const previousTarget = previousTargetRef.current

    if (previousTarget && !previousTarget.isDestroyed) {
      previousTarget.blur?.()
    } else {
      context.renderer.currentFocusedRenderable?.blur?.()
    }

    const nextTarget = activeSurface?.focusTargetRef?.current ?? null
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
  }, [activeSurface, context.renderer])

  return null
}
