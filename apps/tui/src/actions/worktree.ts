import { createWorktree, inspectRepo } from '@harbour/git'
import { refreshProject } from '@harbour/reconciler'
import { Effect } from 'effect'

import type { TuiServices, TuiStore } from '../app-context'
import { formatError } from '../helpers/errors'
import { validateBranchName, validateWorkspaceName } from '../helpers/worktree-form'
import {
  closeWorktreeFormAtom,
  worktreeFormBranchNameAtom,
  worktreeFormProjectIdAtom,
  worktreeFormShowErrorsAtom,
  worktreeFormStepAtom,
  worktreeFormWorkspaceNameAtom,
} from '../routes/browse'
import {
  noticeAtom,
  projectRowsAtom,
} from '../state'
import { openWorkspaces } from './drilldown'
import { clearNotice, setLoading } from './store'

export async function handleWorktreeFormSubmit(services: TuiServices, store: TuiStore) {
  const step = store.get(worktreeFormStepAtom)

  if (step === 'workspace') {
    const workspaceName = store.get(worktreeFormWorkspaceNameAtom).trim()

    if (validateWorkspaceName(workspaceName)) {
      store.set(worktreeFormShowErrorsAtom, true)
      return
    }

    store.set(worktreeFormWorkspaceNameAtom, workspaceName)
    store.set(worktreeFormShowErrorsAtom, false)

    if (store.get(worktreeFormBranchNameAtom).trim().length === 0) {
      store.set(worktreeFormBranchNameAtom, workspaceName)
    }

    store.set(worktreeFormStepAtom, 'branch')
    return
  }

  const workspaceName = store.get(worktreeFormWorkspaceNameAtom).trim()
  const branchName = store.get(worktreeFormBranchNameAtom).trim()

  if (validateWorkspaceName(workspaceName) || validateBranchName(branchName)) {
    store.set(worktreeFormShowErrorsAtom, true)
    return
  }

  store.set(worktreeFormShowErrorsAtom, false)

  const projectId = store.get(worktreeFormProjectIdAtom)
  const project = projectId
    ? store.get(projectRowsAtom).find((row) => row.projectId === projectId) ?? null
    : null

  if (!project) {
    store.set(noticeAtom, 'Project context missing')
    return
  }

  setLoading(store, true)
  clearNotice(store)

  try {
    const repo = await Effect.runPromise(inspectRepo(project.repoPath))

    await Effect.runPromise(createWorktree(repo, { branchName, workspaceName }))
    await Effect.runPromise(refreshProject(project.label, services.options))
    await openWorkspaces(services, store, project.projectId, {
      selectedWorkspaceName: workspaceName,
      visibility: 'all',
    })
    store.set(closeWorktreeFormAtom)
  } catch (error) {
    store.set(noticeAtom, formatError(error))
  } finally {
    setLoading(store, false)
  }
}
