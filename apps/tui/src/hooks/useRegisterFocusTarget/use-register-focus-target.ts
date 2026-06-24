import { useEffect } from 'react'

import type { FocusTargetRef, SurfaceId } from '../../store'
import { useTuiStore } from '../../store'

export function useRegisterFocusTarget(
  id: SurfaceId,
  focusTargetRef: FocusTargetRef | null,
) {
  const registerFocusTarget = useTuiStore((state) => state.registerFocusTarget)

  useEffect(() => {
    registerFocusTarget(id, focusTargetRef)

    return () => {
      registerFocusTarget(id, null)
    }
  }, [focusTargetRef, id, registerFocusTarget])
}
