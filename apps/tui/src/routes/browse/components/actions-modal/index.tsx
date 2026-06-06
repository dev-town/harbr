import type { BoxRenderable } from '@opentui/core'
import { useEffect, useMemo, useRef } from 'react'

import { ActionsModal, type ActionsModalHandle } from '../../../../components/actions-modal'
import { useRegisterFocusTarget } from '../../../../hooks/useRegisterFocusTarget'
import { useTuiServices } from '../../../../hooks/useTuiServices'
import { selectBrowseActionRows, selectIsBrowseActionsOpen, tuiStore, useTuiStore } from '../../../../store'
import { setBrowseActionsModalHandle } from '../../actions-modal-controller'
import { handleBrowseActionSelect } from '../../actions'

export function BrowseActionsModal() {
  const services = useTuiServices()
  const focusRef = useRef<BoxRenderable | null>(null)
  const modalRef = useRef<ActionsModalHandle | null>(null)
  const isOpen = useTuiStore(selectIsBrowseActionsOpen)
  const selectedId = useTuiStore((state) => state.browse.list.selectedId)
  const projectRows = useTuiStore((state) => state.data.projectRows)
  const workspaceRows = useTuiStore((state) => state.data.workspaceRows)
  const moduleRows = useTuiStore((state) => state.data.moduleRows)
  const currentRuntime = useTuiStore((state) => state.app.currentRuntime)
  const query = useTuiStore((state) => state.browse.list.query)
  const scope = useTuiStore((state) => state.browse.scope)
  const visibility = useTuiStore((state) => state.browse.visibility)
  const rows = useMemo(
    () => selectBrowseActionRows(tuiStore.getState()),
    [currentRuntime, moduleRows, projectRows, query, scope, selectedId, visibility, workspaceRows],
  )
  const onClose = useTuiStore((state) => state.closeActionsMenu)

  useRegisterFocusTarget('actions', isOpen ? focusRef : null)

  useEffect(() => {
    setBrowseActionsModalHandle(isOpen ? modalRef.current : null)

    return () => {
      setBrowseActionsModalHandle(null)
    }
  }, [isOpen])

  return (
    <ActionsModal
      focusRef={focusRef}
      isOpen={isOpen}
      items={rows}
      onClose={onClose}
      onSelect={(item) => handleBrowseActionSelect(services, tuiStore, item)}
      ref={modalRef}
    />
  )
}
