import { atom } from 'jotai'

import { hoveredActiveRowIdAtom, selectedActiveRowIdAtom } from '../atoms'
import { visibleActiveRowsAtom } from './rows'

export const selectedActiveRowAtom = atom(
  (get) => get(visibleActiveRowsAtom).find((row) => row.id === get(selectedActiveRowIdAtom)) ?? null,
)

export const hoveredActiveRowAtom = atom(
  (get) => get(visibleActiveRowsAtom).find((row) => row.id === get(hoveredActiveRowIdAtom)) ?? null,
)
