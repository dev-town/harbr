import { atom } from 'jotai'

export const selectedBrowseRowIdAtom = atom<string | null>(null)
export const hoveredBrowseRowIdAtom = atom<string | null>(null)
