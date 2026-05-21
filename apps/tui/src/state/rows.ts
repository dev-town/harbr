import type { ModuleRow, ProjectRow, WorkspaceRow } from '@harbour/domain'
import { atom } from 'jotai'

export const projectRowsAtom = atom<readonly ProjectRow[]>([])
export const workspaceRowsAtom = atom<readonly WorkspaceRow[]>([])
export const moduleRowsAtom = atom<readonly ModuleRow[]>([])
