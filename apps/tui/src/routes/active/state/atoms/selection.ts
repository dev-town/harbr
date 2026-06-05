import { atom } from 'jotai'

export const selectedActiveRowIdAtom = atom<string | null>(null)
export const hoveredActiveRowIdAtom = atom<string | null>(null)
