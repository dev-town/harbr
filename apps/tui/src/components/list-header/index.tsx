import { theme } from '../../config/theme'
import { padCell } from '../shared/utils/text'

export function ListHeader() {
  return (
    <box marginBottom={1} paddingLeft={1} paddingRight={1} width="100%">
      <text>
        <span fg={theme.muted}>{padCell('', 2)}</span>
        <span fg={theme.muted}>{padCell('Name', 44)}</span>
        <span fg={theme.muted}>{padCell('', 2)}</span>
        <span fg={theme.muted}>{padCell('Type', 12)}</span>
        <span fg={theme.muted}>State</span>
      </text>
    </box>
  )
}
