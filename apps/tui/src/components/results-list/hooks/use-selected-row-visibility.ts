import { CliRenderEvents, type ScrollBoxRenderable } from '@opentui/core'
import { useRenderer } from '@opentui/react'
import { useEffect, type RefObject } from 'react'

type UseSelectedRowVisibilityArgs = {
  rows: readonly { id: string }[]
  rowsVisible: boolean
  scrollboxRef: RefObject<ScrollBoxRenderable | null>
  selectedId: string | null
}

export function useSelectedRowVisibility({
  rows,
  rowsVisible,
  scrollboxRef,
  selectedId,
}: UseSelectedRowVisibilityArgs) {
  const renderer = useRenderer()

  useEffect(() => {
    if (!rowsVisible || !selectedId || !rows.some((row) => row.id === selectedId)) {
      return
    }

    const revealSelection = () => {
      const selectedRow = scrollboxRef.current?.content.findDescendantById(`row:${selectedId}`)

      if (!selectedRow) {
        return
      }

      scrollboxRef.current?.scrollChildIntoView(`row:${selectedId}`)
      renderer.off(CliRenderEvents.FRAME, revealSelection)
    }

    renderer.on(CliRenderEvents.FRAME, revealSelection)
    renderer.requestRender()

    return () => {
      renderer.off(CliRenderEvents.FRAME, revealSelection)
    }
  }, [renderer, rows, rowsVisible, scrollboxRef, selectedId])
}
