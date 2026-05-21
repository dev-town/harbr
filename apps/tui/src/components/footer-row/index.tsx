import { useAtomValue } from 'jotai'

import { theme } from '../../config/theme'
import { breadcrumbAtom, effectiveVisibilityAtom } from '../../state'
import { breadcrumbLabel } from './utils/breadcrumb-label'
import { visibilityColor } from './utils/visibility-color'

export function FooterRow() {
  const breadcrumb = useAtomValue(breadcrumbAtom)
  const visibility = useAtomValue(effectiveVisibilityAtom)

  return (
    <box marginTop={2} paddingLeft={1} paddingRight={1} style={{ backgroundColor: theme.panelSoft }} width="100%">
      <text>
        <span bg={visibilityColor(visibility)} fg={theme.backdrop}> {visibility.toUpperCase()} </span>
        <span fg={theme.muted}>  {breadcrumbLabel(breadcrumb)}</span>
      </text>
    </box>
  )
}
