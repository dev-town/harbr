import { atom } from 'jotai'

import { hoveredBrowseRowIdAtom, selectedBrowseRowIdAtom } from '../atoms'
import { visibleBrowseRowsAtom } from './rows'

export const selectedBrowseRowAtom = atom(
  (get) => get(visibleBrowseRowsAtom).find((row) => row.id === get(selectedBrowseRowIdAtom)) ?? null,
)

export const hoveredBrowseRowAtom = atom(
  (get) => get(visibleBrowseRowsAtom).find((row) => row.id === get(hoveredBrowseRowIdAtom)) ?? null,
)
