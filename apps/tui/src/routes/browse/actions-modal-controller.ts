import type { ActionsModalHandle } from '../../components/actions-modal'

let browseActionsModalHandle: ActionsModalHandle | null = null

export function getBrowseActionsModalHandle() {
  return browseActionsModalHandle
}

export function setBrowseActionsModalHandle(handle: ActionsModalHandle | null) {
  browseActionsModalHandle = handle
}
