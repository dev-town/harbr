import type { ReactNode } from 'react'

import { theme } from '~/config/theme'

type LayoutProps = {
  children: ReactNode
}

type LayoutSlotProps = {
  children: ReactNode
}

function Root({ children }: LayoutProps) {
  return (
    <box
      border
      borderColor={theme.border}
      borderStyle="rounded"
      flexDirection="column"
      height="100%"
      style={{ backgroundColor: theme.panel }}
      width="100%"
    >
      {children}
    </box>
  )
}

function Header({ children }: LayoutSlotProps) {
  return (
    <box
      flexDirection="row"
      justifyContent="flex-end"
      marginBottom={1}
      paddingRight={3}
      width="100%"
    >
      {children}
    </box>
  )
}

function TabsSlot({ children }: LayoutSlotProps) {
  return (
    <box
      border={['bottom']}
      borderColor={theme.border}
      flexDirection="column"
      height={3}
      marginBottom={1}
      paddingLeft={2}
      width="100%"
    >
      {children}
    </box>
  )
}

function Content({ children }: LayoutSlotProps) {
  return (
    <box
      flexDirection="column"
      flexGrow={1}
      paddingLeft={2}
      paddingRight={2}
      width="100%"
    >
      {children}
    </box>
  )
}

function Footer({ children }: LayoutSlotProps) {
  return (
    <box
      width="100%"
      height={2}
      border={['top']}
      borderColor={theme.border}
      style={{
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {children}
    </box>
  )
}

export const Layout = Object.assign(Root, {
  Content,
  Footer,
  Header,
  Tabs: TabsSlot,
})
