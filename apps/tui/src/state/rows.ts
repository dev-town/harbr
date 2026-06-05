import { atom } from 'jotai'

import type { ActiveRuntimeRow, ModuleRow, ProjectRow, WorkspaceRow } from '../types/rows'

export const activeRuntimeRowsAtom = atom<readonly ActiveRuntimeRow[]>([])
export const projectRowsAtom = atom<readonly ProjectRow[]>([])
export const workspaceRowsAtom = atom<readonly WorkspaceRow[]>([])
export const moduleRowsAtom = atom<readonly ModuleRow[]>([])
