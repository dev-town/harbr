import { theme } from '../../config/theme'
import { selectBreadcrumb, selectEffectiveVisibility, selectProjectIssue, useTuiStore } from '../../store'
import { breadcrumbLabel } from './utils/breadcrumb-label'
import { visibilityColor } from './utils/visibility-color'

export function FooterRow() {
  const breadcrumb = useTuiStore(selectBreadcrumb)
  const currentRoute = useTuiStore((state) => state.app.currentRoute)
  const visibility = useTuiStore(selectEffectiveVisibility)
  const projectIssue = useTuiStore(selectProjectIssue)
  const showVisibility = currentRoute === 'browse'

  return (
    <box paddingLeft={1} paddingRight={1} width="100%">
      <text>
        {showVisibility ? (
          <span bg={visibilityColor(visibility)} fg={theme.backdrop}>
            {' '}
            {visibility.toUpperCase()}{' '}
          </span>
        ) : null}
        <span fg={projectIssue ? theme.error : theme.muted}>
          {' '}
          {breadcrumbLabel(breadcrumb)}
        </span>
        {projectIssue ? <span fg={theme.error}> {projectIssue}</span> : null}
      </text>
    </box>
  )
}
