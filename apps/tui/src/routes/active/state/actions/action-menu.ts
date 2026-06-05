import { atom } from 'jotai'

import { noticeAtom } from '../../../../state/app'
import type { ActiveActionRow, ActiveRuntimeRow } from '../../../../types/rows'
import { actionRowsAtom, isActionsOpenAtom } from '../atoms'
import { selectedActiveRowAtom } from '../derived'

export const openActionsMenuAtom = atom(null, (get, set) => {
  if (get(isActionsOpenAtom)) {
    return
  }

  const target = get(selectedActiveRowAtom)

  if (!target) {
    set(noticeAtom, 'No actions for current context')
    return
  }

  set(actionRowsAtom, [makeActionRow(target)])
  set(isActionsOpenAtom, true)
  set(noticeAtom, null)
})

export const closeActionsMenuAtom = atom(null, (_get, set) => {
  set(actionRowsAtom, [])
  set(isActionsOpenAtom, false)
  set(noticeAtom, null)
})

function makeActionRow(target: ActiveRuntimeRow): ActiveActionRow {
  return {
    id: `action.open:${target.id}`,
    kind: 'active-action',
    label: 'Open',
    target,
  }
}
