import type { ReactElement, ReactNode } from 'react'
import { Children, cloneElement, isValidElement } from 'react'

import type { AppRoute } from '~/types/navigation'
import type { TabProps } from './tab'

type TabsProps = {
  children: ReactNode
  onValueChange: (value: AppRoute) => void
  value: AppRoute
}

export function Tabs({ children, onValueChange, value }: TabsProps) {
  return (
    <box flexDirection="row" width="100%">
      {Children.map(children, (child) => {
        if (!isValidElement<TabProps>(child)) {
          return child
        }

        return cloneElement(child as ReactElement<TabProps>, {
          isSelected: child.props.value === value,
          onSelect: onValueChange,
        })
      })}
    </box>
  )
}
