import { useAtomValue } from 'jotai'

import { theme } from '../../config/theme'
import { breadcrumbAtom, effectiveVisibilityAtom, selectedProjectIssueAtom } from '../../state'
import { breadcrumbLabel } from './utils/breadcrumb-label'
import { visibilityColor } from './utils/visibility-color'

export function FooterRow() {
  const breadcrumb = useAtomValue(breadcrumbAtom)
  const visibility = useAtomValue(effectiveVisibilityAtom)
  const projectIssue = useAtomValue(selectedProjectIssueAtom)

  return (
    <box marginTop={2} paddingLeft={1} paddingRight={1} style={{ backgroundColor: theme.panelSoft }} width="100%">
      <text>
        <span bg={visibilityColor(visibility)} fg={theme.backdrop}> {visibility.toUpperCase()} </span>
        <span fg={projectIssue ? theme.error : theme.muted}>  {breadcrumbLabel(breadcrumb)}</span>
        {projectIssue ? <span fg={theme.error}>  {projectIssue}</span> : null}
      </text>
    </box>
  )
}
