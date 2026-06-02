import { atom } from 'jotai'

import type { ActionRow, ModuleRow, ProjectRow, WorkspaceRow } from '../types/rows'

export const actionRowsAtom = atom<readonly ActionRow[]>([])
export const projectRowsAtom = atom<readonly ProjectRow[]>([])
export const workspaceRowsAtom = atom<readonly WorkspaceRow[]>([])
export const moduleRowsAtom = atom<readonly ModuleRow[]>([])
