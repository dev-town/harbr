import { createWorktree, inspectRepo } from '@harbour/git'
import { refreshProject } from '@harbour/reconciler'
import { Effect } from 'effect'

import type { TuiServices, TuiStore } from '../app-context'
import { formatError } from '../helpers/errors'
import { validateBranchName, validateWorkspaceName } from '../helpers/worktree-form'
import { openWorkspaces } from './drilldown'

export async function handleWorktreeFormSubmit(services: TuiServices, store: TuiStore) {
  const step = store.getState().worktreeForm.step

  if (step === 'workspace') {
    const workspaceName = store.getState().worktreeForm.workspaceName.trim()

    if (validateWorkspaceName(workspaceName)) {
      store.setState((state) => ({ worktreeForm: { ...state.worktreeForm, showErrors: true } }))
      return
    }

    store.setState((state) => ({ worktreeForm: { ...state.worktreeForm, showErrors: false, workspaceName } }))

    if (store.getState().worktreeForm.branchName.trim().length === 0) {
      store.setState((state) => ({ worktreeForm: { ...state.worktreeForm, branchName: workspaceName } }))
    }

    store.setState((state) => ({ worktreeForm: { ...state.worktreeForm, step: 'branch' } }))
    return
  }

  const workspaceName = store.getState().worktreeForm.workspaceName.trim()
  const branchName = store.getState().worktreeForm.branchName.trim()

  if (validateWorkspaceName(workspaceName) || validateBranchName(branchName)) {
    store.setState((state) => ({ worktreeForm: { ...state.worktreeForm, showErrors: true } }))
    return
  }

  store.setState((state) => ({ worktreeForm: { ...state.worktreeForm, showErrors: false } }))

  const projectId = store.getState().worktreeForm.projectId
  const project = projectId
    ? store.getState().data.projectRows.find((row) => row.projectId === projectId) ?? null
    : null

  if (!project) {
    store.getState().setNotice('Project context missing', 'warning')
    return
  }

  store.getState().setLoading(true)
  store.getState().clearNotice()

  try {
    const repo = await Effect.runPromise(inspectRepo(project.repoPath))

    await Effect.runPromise(createWorktree(repo, { branchName, workspaceName }))
    await Effect.runPromise(refreshProject(project.label, services.options))
    await openWorkspaces(services, store, project.projectId, {
      selectedWorkspaceName: workspaceName,
      visibility: 'all',
    })
    store.getState().closeWorktreeForm()
  } catch (error) {
    store.getState().setNotice(formatError(error), 'error')
  } finally {
    store.getState().setLoading(false)
  }
}
