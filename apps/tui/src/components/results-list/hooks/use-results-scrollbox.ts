import { CliRenderEvents, type ScrollBoxRenderable } from '@opentui/core'
import { useRenderer } from '@opentui/react'
import { useCallback, useEffect, useRef } from 'react'

export function useResultsScrollbox() {
  const renderer = useRenderer()
  const scrollboxRef = useRef<ScrollBoxRenderable | null>(null)
  const pendingResetRef = useRef<(() => void) | null>(null)
  const clearPendingReset = useCallback(() => {
    const pendingReset = pendingResetRef.current
    if (pendingReset) {
      renderer.off(CliRenderEvents.FRAME, pendingReset)
      pendingResetRef.current = null
    }
  }, [renderer])
  const setScrollboxRef = useCallback(
    (scrollbox: ScrollBoxRenderable | null) => {
      clearPendingReset()
      scrollboxRef.current = scrollbox

      if (!scrollbox) {
        return
      }

      // A new scrollbox starts with zero-height geometry. Keep its automatic
      // scrollbar hidden until OpenTUI completes the first measured frame.
      scrollbox.verticalScrollBar.visible = false

      const resetVisibility = () => {
        if (scrollboxRef.current === scrollbox) {
          scrollbox.verticalScrollBar.resetVisibilityControl()
        }
        renderer.off(CliRenderEvents.FRAME, resetVisibility)
        pendingResetRef.current = null
      }

      pendingResetRef.current = resetVisibility
      renderer.on(CliRenderEvents.FRAME, resetVisibility)
      renderer.requestRender()
    },
    [clearPendingReset, renderer],
  )

  useEffect(() => {
    return clearPendingReset
  }, [clearPendingReset])

  return { scrollboxRef, setScrollboxRef }
}
