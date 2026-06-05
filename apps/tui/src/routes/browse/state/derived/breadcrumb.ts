import { atom } from 'jotai'

import { projectRowsAtom, workspaceRowsAtom } from '../../../../state/rows'
import {
  browseSectionAtom,
  selectedProjectIdAtom,
  selectedWorkspaceIdAtom,
  selectedWorkspaceImplicitAtom,
} from '../atoms'

export const browseBreadcrumbAtom = atom((get) => {
  const selectedProjectId = get(selectedProjectIdAtom)
  const selectedWorkspaceId = get(selectedWorkspaceIdAtom)
  const selectedWorkspaceImplicit = get(selectedWorkspaceImplicitAtom)
  const currentSection = get(browseSectionAtom)
  const projectLabel = get(projectRowsAtom).find((row) => row.projectId === selectedProjectId)?.label
  const workspaceLabel = get(workspaceRowsAtom).find((row) => row.workspaceId === selectedWorkspaceId)?.label

  if (
    currentSection === 'modules' &&
    projectLabel &&
    workspaceLabel &&
    !selectedWorkspaceImplicit
  ) {
    return `${projectLabel} › ${workspaceLabel}`
  }

  if (currentSection === 'modules' && projectLabel) {
    return projectLabel
  }

  if (currentSection === 'workspaces' && projectLabel) {
    return projectLabel
  }

  return ''
})

export const selectedProjectIssueAtom = atom((get) => {
  const selectedProjectId = get(selectedProjectIdAtom)

  if (!selectedProjectId) {
    return null
  }

  return get(projectRowsAtom).find((row) => row.projectId === selectedProjectId)?.projectIssue ?? null
})
