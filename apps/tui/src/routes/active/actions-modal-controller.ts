import type { ActionsModalHandle } from '../../components/actions-modal'

let activeActionsModalHandle: ActionsModalHandle | null = null

export function getActiveActionsModalHandle() {
  return activeActionsModalHandle
}

export function setActiveActionsModalHandle(handle: ActionsModalHandle | null) {
  activeActionsModalHandle = handle
}
