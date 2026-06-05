import { atom } from 'jotai'

import { noticeAtom } from '../../../../state/app'
import {
  actionRowsAtom,
  isActionsOpenAtom,
  isWorktreeFormOpenAtom,
  worktreeFormBranchNameAtom,
  worktreeFormProjectIdAtom,
  worktreeFormShowErrorsAtom,
  worktreeFormStepAtom,
  worktreeFormWorkspaceNameAtom,
} from '../atoms'

export const openCreateWorkspaceFormAtom = atom(null, (_get, set, projectId: string) => {
  set(isActionsOpenAtom, false)
  set(actionRowsAtom, [])
  set(worktreeFormProjectIdAtom, projectId)
  set(worktreeFormWorkspaceNameAtom, '')
  set(worktreeFormBranchNameAtom, '')
  set(worktreeFormShowErrorsAtom, false)
  set(worktreeFormStepAtom, 'workspace')
  set(isWorktreeFormOpenAtom, true)
  set(noticeAtom, null)
})

export const closeWorktreeFormAtom = atom(null, (_get, set) => {
  set(isWorktreeFormOpenAtom, false)
  set(worktreeFormProjectIdAtom, null)
  set(worktreeFormWorkspaceNameAtom, '')
  set(worktreeFormBranchNameAtom, '')
  set(worktreeFormShowErrorsAtom, false)
  set(worktreeFormStepAtom, 'workspace')
  set(noticeAtom, null)
})

export const backWorktreeFormAtom = atom(null, (get, set) => {
  if (get(worktreeFormStepAtom) === 'branch') {
    set(worktreeFormBranchNameAtom, '')
    set(worktreeFormShowErrorsAtom, false)
    set(worktreeFormStepAtom, 'workspace')
    return
  }

  set(closeWorktreeFormAtom)
})
