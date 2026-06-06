import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ActionItemBase } from '../types'

type UseActionSelectionArgs<T extends ActionItemBase> = {
  initialSelectedId: string | null | undefined
  isOpen: boolean
  items: readonly T[]
  onSelect: (item: T) => void
}

export function useActionSelection<T extends ActionItemBase>({
  initialSelectedId,
  isOpen,
  items,
  onSelect,
}: UseActionSelectionArgs<T>) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const initialResolvedId = useMemo(
    () => resolveInitialSelectedId(items, initialSelectedId),
    [initialSelectedId, items],
  )

  useEffect(() => {
    setSelectedId(isOpen ? initialResolvedId : null)
  }, [initialResolvedId, isOpen])

  const moveSelection = useCallback(
    (delta: number) => {
      if (items.length === 0) {
        return
      }

      const currentIndex = getIndexForItemId(items, selectedId)
      const nextIndex = clampIndex(currentIndex + delta, items.length)

      setSelectedId(items[nextIndex]?.id ?? null)
    },
    [items, selectedId],
  )

  const selectCurrent = useCallback(() => {
    const item = items.find((entry) => entry.id === selectedId) ?? items[0]

    if (item) {
      onSelect(item)
    }
  }, [items, onSelect, selectedId])

  return {
    selectedId,
    moveSelection,
    selectCurrent,
    setSelectedId,
  }
}

function resolveInitialSelectedId<T extends ActionItemBase>(
  items: readonly T[],
  initialSelectedId?: string | null,
) {
  if (
    initialSelectedId &&
    items.some((item) => item.id === initialSelectedId)
  ) {
    return initialSelectedId
  }

  return items[0]?.id ?? null
}

function getIndexForItemId(
  items: readonly ActionItemBase[],
  itemId: string | null,
) {
  if (items.length === 0) {
    return 0
  }

  const index = itemId ? items.findIndex((item) => item.id === itemId) : -1

  return index >= 0 ? index : 0
}

function clampIndex(index: number, length: number) {
  if (length === 0) {
    return 0
  }

  return Math.max(0, Math.min(length - 1, index))
}
