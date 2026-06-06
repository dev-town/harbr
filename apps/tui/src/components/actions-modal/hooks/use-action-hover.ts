import { useEffect, useState } from 'react'

export function useActionHover(isOpen: boolean) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setHoveredId(null)
    }
  }, [isOpen])

  return {
    hoveredId,
    clearHoveredId: () => setHoveredId(null),
    setHoveredId,
  }
}
