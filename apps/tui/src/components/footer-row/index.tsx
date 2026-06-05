import { useAtomValue } from 'jotai'

import { theme } from '../../config/theme'
import { effectiveVisibilityAtom } from '../../state'
import { breadcrumbAtom, selectedProjectIssueAtom } from '../../state/derived'
import { breadcrumbLabel } from './utils/breadcrumb-label'
import { visibilityColor } from './utils/visibility-color'

export function FooterRow() {
  const breadcrumb = useAtomValue(breadcrumbAtom)
  const visibility = useAtomValue(effectiveVisibilityAtom)
  const projectIssue = useAtomValue(selectedProjectIssueAtom)

  return (
    <box paddingLeft={1} paddingRight={1} width="100%">
      <text>
        <span bg={visibilityColor(visibility)} fg={theme.backdrop}>
          {' '}
          {visibility.toUpperCase()}{' '}
        </span>
        <span fg={projectIssue ? theme.error : theme.muted}>
          {' '}
          {breadcrumbLabel(breadcrumb)}
        </span>
        {projectIssue ? <span fg={theme.error}> {projectIssue}</span> : null}
      </text>
    </box>
  )
}
