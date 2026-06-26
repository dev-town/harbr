import packageJson from '../../package.json'

const packageInfo = packageJson as { version?: string }

export function isHelpRequest(args: readonly string[]) {
  return args.includes('--help') || args.includes('-h')
}

export function isVersionRequest(args: readonly string[]) {
  return args.includes('--version') || args.includes('-v')
}

export function formatRootHelp() {
  return [
    'harbr - terminal-native workspace orchestration',
    '',
    'Usage:',
    '  harbr [options]',
    '  harbr tui [options]',
    '  harbr sync [options]',
    '  harbr help',
    '',
    'Commands:',
    '  tui        Open the interactive TUI',
    '  sync       Sync configured projects',
    '  help       Show this help',
    '',
    'Options:',
    '  --path <config>   Config path',
    '  --db-path <db>    Database path',
    '  -h, --help        Show help',
    '  -v, --version     Show version',
  ].join('\n')
}

export function formatSyncHelp() {
  return [
    'harbr sync - sync configured projects',
    '',
    'Usage:',
    '  harbr sync [options]',
    '',
    'Options:',
    '  --json            Print JSON output',
    '  --path <config>   Config path',
    '  --db-path <db>    Database path',
    '  -h, --help        Show help',
  ].join('\n')
}

export function formatUnknownCommandHelp(command: string) {
  return [`unknown command: ${command}`, '', formatRootHelp()].join('\n')
}

export function formatVersion() {
  return packageInfo.version ? `harbr ${packageInfo.version}` : 'harbr'
}
