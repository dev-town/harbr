#!/usr/bin/env bun

import assert from 'node:assert/strict'

import { ScrollBoxRenderable, type Renderable } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { KeymapProvider } from '@opentui/keymap/react'
import { createRoot } from '@opentui/react'
import { act, type ReactNode } from 'react'

import { Layout } from '../src/components/layout'
import { Logo } from '../src/components/logo'
import { ResultsList } from '../src/components/results-list'
import { SearchBar } from '../src/components/search-bar'
import { StartupShell } from '../src/components/startup-shell'
import { Tab, Tabs } from '../src/components/tabs'
import { createTuiKeymap } from '../src/keymap/create-keymap'

type Stage = 'loading' | 'overflow' | 'populated'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const setup = await createTestRenderer({ height: 36, width: 120 })
const root = createRoot(setup.renderer)
const keymap = createTuiKeymap(setup.renderer)

try {
  const bootstrap = await capture(
    <StartupShell onCommit={() => undefined} onQuit={() => undefined} />,
  )
  const loading = await capture(<ResultsShell stage="loading" />)
  const populated = await capture(<ResultsShell stage="populated" />)
  const overflowInitial = await capture(<ResultsShell stage="overflow" />)

  await new Promise<void>((resolve) => process.nextTick(resolve))
  await setup.renderOnce()

  const overflowSettled = findScrollbox(setup.renderer.root)

  assert.equal(loading.tabsRow, bootstrap.tabsRow)
  assert.equal(populated.tabsRow, bootstrap.tabsRow)
  assert.equal(loading.scrollbarVisible, false)
  assert.equal(populated.scrollbarVisible, false)
  assert.equal(overflowInitial.scrollbarVisible, false)
  assert.equal(overflowSettled?.verticalScrollBar.visible, true)

  console.log(
    'Validated stable startup header geometry and deferred scrollbar visibility.',
  )
} finally {
  act(() => root.unmount())
  setup.renderer.destroy()
  globalThis.IS_REACT_ACT_ENVIRONMENT = false
}

async function capture(node: ReactNode) {
  act(() =>
    root.render(<KeymapProvider keymap={keymap}>{node}</KeymapProvider>),
  )
  await setup.renderOnce()

  const rows = setup.captureCharFrame().split('\n')
  const tabsRow = rows.findIndex((row) => row.includes('Active'))

  assert.notEqual(tabsRow, -1)

  return {
    scrollbarVisible: findScrollbox(setup.renderer.root)?.verticalScrollBar
      .visible,
    tabsRow,
  }
}

function findScrollbox(
  rootRenderable: Renderable,
): ScrollBoxRenderable | undefined {
  if (rootRenderable instanceof ScrollBoxRenderable) return rootRenderable

  for (const child of rootRenderable.getChildren()) {
    const found = findScrollbox(child)
    if (found) return found
  }
}

function ResultsShell({ stage }: { stage: Stage }) {
  const rows =
    stage === 'overflow'
      ? Array.from({ length: 100 }, (_, index) => ({ id: String(index) }))
      : stage === 'populated'
        ? [{ id: 'one' }, { id: 'two' }]
        : []

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
          <ResultsList
            hoveredId={null}
            isLoading={stage === 'loading'}
            renderRow={(row) => <text>{row.id}</text>}
            rows={rows}
            selectedId={rows[0]?.id ?? null}
          />
        </box>
      </Layout.Content>
      <Layout.Footer>
        <text>Footer</text>
      </Layout.Footer>
    </Layout>
  )
}
