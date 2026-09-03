import { useEffect, useState } from 'react'

export function useResultsLoading(forceLoading: boolean) {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (!forceLoading) {
      setShowLoading(false)
      return
    }

    const timeout = setTimeout(() => {
      setShowLoading(true)
    }, 500)

    return () => {
      clearTimeout(timeout)
    }
  }, [forceLoading])

  return showLoading
}
