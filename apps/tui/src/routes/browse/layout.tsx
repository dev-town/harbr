import type { ReactNode } from 'react'

export function BrowseRouteLayout({ children, search }: { children: ReactNode; search: ReactNode }) {
  return (
    <box flexDirection="column" flexGrow={1} width="100%">
      <box marginBottom={1} width="100%">
        {search}
      </box>
      {children}
    </box>
  )
}
