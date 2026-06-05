import { atom } from 'jotai'

import type { ActiveActionRow } from '../../../../types/rows'

export const isActionsOpenAtom = atom(false)
export const actionRowsAtom = atom<readonly ActiveActionRow[]>([])
