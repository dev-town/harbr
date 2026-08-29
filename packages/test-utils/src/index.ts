import type { RuntimeTarget, WindowConfig } from '@harbr/domain'

export const runtimeLayoutTargetFixture: RuntimeTarget = {
  cwd: '/work/alpha-feature',
  moduleName: null,
  projectName: 'alpha',
  workspaceName: 'feature',
}

export const runtimeLayoutWindowsFixture: readonly WindowConfig[] = [
  {
    name: 'Editor',
    panes: [
      { command: 'nvim .', name: 'Code' },
      {
        command: ['bun run test', 'bun run lint'],
        cwd: 'apps/cli',
        name: 'Tests',
      },
    ],
  },
  {
    name: 'Logs',
    panes: [{ cwd: '/var/log/alpha', name: 'Server logs' }],
  },
]
