import { useBindings } from '@opentui/keymap/react'
import { useLayoutEffect } from 'react'

import { Layout } from '~/components/layout'
import { Logo } from '~/components/logo'
import { SearchBar } from '~/components/search-bar'
import { Tab, Tabs } from '~/components/tabs'
import { theme } from '~/config/theme'
import { makeRootBindings } from '~/keymap/bindings'
import { keymapPriority } from '~/keymap/priorities'

type StartupShellProps = {
  error?: string
  onCommit: () => void
  onQuit: () => void
}

export function StartupShell({ error, onCommit, onQuit }: StartupShellProps) {
  useBindings(
    () => ({
      priority: keymapPriority.root,
      bindings: makeRootBindings({ onHelp: () => undefined, onQuit }),
    }),
    [onQuit],
  )

  useLayoutEffect(onCommit, [onCommit])

  return (
    <Layout>
      <Layout.Header>
        <Logo />
      </Layout.Header>
      <Layout.Tabs>
        <Tabs value="active" onValueChange={() => undefined}>
          <Tab label="Active" value="active" />
          <Tab label="Browse" value="browse" />
        </Tabs>
      </Layout.Tabs>
      <Layout.Content>
        <box flexDirection="column" flexGrow={1} width="100%">
          <box marginBottom={1} width="100%">
            <SearchBar
              focused={false}
              onChange={() => undefined}
              onSubmit={() => undefined}
              placeholder="Filter active sessions"
              value=""
            />
          </box>
          {error ? <text fg={theme.error}>{error}</text> : null}
          <box style={{ height: '100%', marginBottom: 2 }} />
        </box>
      </Layout.Content>
      <Layout.Footer>
        <box
          flexDirection="row"
          justifyContent="flex-end"
          paddingLeft={1}
          paddingRight={1}
          width="100%"
        >
          <text>
            <span fg={theme.active}>Esc</span>
            <span fg={theme.muted}> Normal </span>
            <span fg={theme.active}>?</span>
            <span fg={theme.muted}> Help</span>
          </text>
        </box>
      </Layout.Footer>
    </Layout>
  )
}
