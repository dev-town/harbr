import { theme } from '../../config/theme'
import type { AppRoute } from '../../types/navigation'

export type TabProps = {
  isSelected?: boolean
  label: string
  onSelect?: (value: AppRoute) => void
  value: AppRoute
}

export function Tab({ isSelected = false, label, onSelect, value }: TabProps) {
  return (
    <box
      border={['top', 'right', 'left']}
      borderColor={isSelected ? theme.border : theme.borderSoft}
      borderStyle="rounded"
      flexDirection="row"
      height={2}
      marginRight={1}
      onMouseDown={() => onSelect?.(value)}
      paddingLeft={2}
      paddingRight={2}
      style={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <text>
        <strong fg={isSelected ? theme.active : theme.muted}>{label}</strong>
      </text>
    </box>
  )
}
