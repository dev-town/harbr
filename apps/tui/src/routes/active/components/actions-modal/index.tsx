import type { BoxRenderable } from '@opentui/core'
import { useMemo, useRef } from 'react'

import { ActionsModal } from '../../../../components/actions-modal'
import { useRegisterFocusTarget } from '../../../../hooks/useRegisterFocusTarget'
import { useTuiServices } from '../../../../hooks/useTuiServices'
import {
  selectActiveActionRows,
  selectIsActiveActionsOpen,
  tuiStore,
  useTuiStore,
} from '../../../../store'
import { handleActiveActionSelect } from '../../actions'

export function ActiveActionsModal() {
  const services = useTuiServices()
  const focusRef = useRef<BoxRenderable | null>(null)
  const isOpen = useTuiStore(selectIsActiveActionsOpen)
  const selectedId = useTuiStore((state) => state.active.list.selectedId)
  const sourceRows = useTuiStore((state) => state.data.activeRuntimeRows)
  const projectWindows = useTuiStore((state) => state.data.projectWindows)
  const currentRuntime = useTuiStore((state) => state.app.currentRuntime)
  const query = useTuiStore((state) => state.active.list.query)
  const rows = useMemo(
    () => selectActiveActionRows(tuiStore.getState()),
    [currentRuntime, projectWindows, query, selectedId, sourceRows],
  )
  const onClose = useTuiStore((state) => state.closeActionsMenu)

  useRegisterFocusTarget('actions', isOpen ? focusRef : null)

  return (
    <ActionsModal
      focusRef={focusRef}
      isOpen={isOpen}
      items={rows}
      onClose={onClose}
      onSelect={(item) => handleActiveActionSelect(services, tuiStore, item)}
    />
  )
}
