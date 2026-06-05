import { atom } from 'jotai'

import type { ActionRow } from '../../../../types/rows'

export const isActionsOpenAtom = atom(false)
export const actionRowsAtom = atom<readonly ActionRow[]>([])
