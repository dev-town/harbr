import { useStore } from 'jotai'
import { useEffect } from 'react'

import type { FocusTargetRef, SurfaceId } from '../../state'
import {
  actionsFocusTargetRefAtom,
  browserFocusTargetRefAtom,
  worktreeFormFocusTargetRefAtom,
} from '../../state'

export function useRegisterFocusTarget(id: SurfaceId, focusTargetRef: FocusTargetRef | null) {
  const store = useStore()

  useEffect(() => {
    const focusTargetAtom =
      id === 'actions'
        ? actionsFocusTargetRefAtom
        : id === 'worktree-form'
          ? worktreeFormFocusTargetRefAtom
          : browserFocusTargetRefAtom

    store.set(focusTargetAtom, focusTargetRef)

    return () => {
      store.set(focusTargetAtom, null)
    }
  }, [focusTargetRef, id, store])
}
