import type { BoxRenderable } from '@opentui/core'
import { useAtomValue, useSetAtom, useStore } from 'jotai'
import { useEffect, useRef } from 'react'

import { ActionsModal, type ActionsModalHandle } from '../../../../components/actions-modal'
import { useRegisterFocusTarget } from '../../../../hooks/useRegisterFocusTarget'
import { useTuiServices } from '../../../../hooks/useTuiServices'
import { setActiveActionsModalHandle } from '../../actions-modal-controller'
import { handleActiveActionSelect } from '../../actions'
import { actionRowsAtom, isActionsOpenAtom } from '../../atoms'
import { closeActionsMenuAtom } from '../../state/actions'

export function ActiveActionsModal() {
  const services = useTuiServices()
  const store = useStore()
  const focusRef = useRef<BoxRenderable | null>(null)
  const modalRef = useRef<ActionsModalHandle | null>(null)
  const isOpen = useAtomValue(isActionsOpenAtom)
  const rows = useAtomValue(actionRowsAtom)
  const onClose = useSetAtom(closeActionsMenuAtom)

  useRegisterFocusTarget('actions', isOpen ? focusRef : null)

  useEffect(() => {
    setActiveActionsModalHandle(isOpen ? modalRef.current : null)

    return () => {
      setActiveActionsModalHandle(null)
    }
  }, [isOpen])

  return (
    <ActionsModal
      focusRef={focusRef}
      isOpen={isOpen}
      items={rows}
      onClose={onClose}
      onSelect={(item) => handleActiveActionSelect(services, store, item)}
      ref={modalRef}
    />
  )
}
