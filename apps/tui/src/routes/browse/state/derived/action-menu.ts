import { atom } from 'jotai'

import { actionRowsAtom, hoveredActionRowIdAtom, selectedActionRowIdAtom } from '../atoms'

export const selectedActionRowAtom = atom(
  (get) => get(actionRowsAtom).find((row) => row.id === get(selectedActionRowIdAtom)) ?? null,
)

export const hoveredActionRowAtom = atom(
  (get) => get(actionRowsAtom).find((row) => row.id === get(hoveredActionRowIdAtom)) ?? null,
)
