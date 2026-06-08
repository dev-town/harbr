import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import boundaries from 'eslint-plugin-boundaries'

const layerNames = [
  'domain',
  'db',
  'config',
  'git',
  'runtime-tmux',
  'scanner',
  'reconciler',
  'ui',
  'test-utils',
]

export const baseConfig = tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.turbo/**',
      '**/dist/**',
      '**/coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,mts,cts,js,mjs,cjs}'],
    plugins: {
      boundaries,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
)

export const boundaryConfig = {
  files: ['apps/*/src/**/*.ts', 'packages/*/src/**/*.ts'],
  plugins: {
    boundaries,
  },
  settings: {
    'boundaries/elements': [
      {
        type: 'app',
        pattern: 'apps/*/src/**',
        mode: 'full',
      },
      {
        type: 'domain',
        pattern: 'packages/domain/src/**',
        mode: 'full',
      },
      {
        type: 'db',
        pattern: 'packages/db/src/**',
        mode: 'full',
      },
      {
        type: 'config',
        pattern: 'packages/config/src/**',
        mode: 'full',
      },
      {
        type: 'git',
        pattern: 'packages/git/src/**',
        mode: 'full',
      },
      {
        type: 'runtime-tmux',
        pattern: 'packages/runtime-tmux/src/**',
        mode: 'full',
      },
      {
        type: 'scanner',
        pattern: 'packages/scanner/src/**',
        mode: 'full',
      },
      {
        type: 'reconciler',
        pattern: 'packages/reconciler/src/**',
        mode: 'full',
      },
      {
        type: 'ui',
        pattern: 'packages/ui/src/**',
        mode: 'full',
      },
      {
        type: 'test-utils',
        pattern: 'packages/test-utils/src/**',
        mode: 'full',
      },
    ],
  },
  rules: {
    'boundaries/no-private': 'error',
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          {
            from: ['app'],
            allow: layerNames,
          },
          {
            from: ['domain'],
            allow: [],
          },
          {
            from: ['ui'],
            allow: ['domain'],
          },
          {
            from: ['db'],
            allow: ['domain'],
          },
          {
            from: ['config'],
            allow: ['domain'],
          },
          {
            from: ['git'],
            allow: ['domain'],
          },
          {
            from: ['runtime-tmux'],
            allow: ['domain'],
          },
          {
            from: ['scanner'],
            allow: ['domain', 'config', 'git'],
          },
          {
            from: ['reconciler'],
            allow: ['domain', 'db', 'scanner'],
          },
          {
            from: ['test-utils'],
            allow: ['domain', 'db', 'config'],
          },
        ],
      },
    ],
  },
}
