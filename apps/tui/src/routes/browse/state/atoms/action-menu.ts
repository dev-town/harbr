import { atom } from 'jotai'

import type { ActionRow } from '../../../../types/rows'

export const isActionsOpenAtom = atom(false)
export const actionRowsAtom = atom<readonly ActionRow[]>([])
export const selectedActionRowIdAtom = atom<string | null>(null)
export const hoveredActionRowIdAtom = atom<string | null>(null)
