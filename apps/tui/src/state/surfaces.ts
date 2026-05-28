import type { HarbourCommandId } from '@harbour/domain'
import { atom } from 'jotai'

export type SurfaceId = 'actions' | 'browse' | 'confirm' | 'worktree-form'

export type SurfaceHandlers = Partial<Record<HarbourCommandId, () => void | Promise<void>>>

export type FocusTarget = {
  blur?: () => void
  focus?: () => void
  isDestroyed?: boolean
}

export type FocusTargetRef = {
  current: FocusTarget | null
}

export type SurfaceEntry = {
  focusTargetRef?: FocusTargetRef
  token: symbol
  id: SurfaceId
  handlers: SurfaceHandlers
}

export type GlobalEntry = {
  token: symbol
  handlers: SurfaceHandlers
}

export const surfaceStackAtom = atom<readonly SurfaceEntry[]>([])
export const globalHandlersAtom = atom<readonly GlobalEntry[]>([])
export const activeSurfaceAtom = atom((get) => get(surfaceStackAtom).at(-1) ?? null)
