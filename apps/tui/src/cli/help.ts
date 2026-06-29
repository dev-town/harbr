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
    '  harbr profile <command>',
    '  harbr help',
    '',
    'Commands:',
    '  tui        Open the interactive TUI',
    '  sync       Sync configured projects',
    '  profile    Manage local profiling infrastructure',
    '  help       Show this help',
    '',
    'Options:',
    '  --path <config>              Config path',
    '  --db-path <db>               Database path',
    '  --profile                    Export local OTEL traces',
    '  --profile-endpoint <url>     OTLP endpoint',
    '  -h, --help                   Show help',
    '  -v, --version                Show version',
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
    '  --json                      Print JSON output',
    '  --path <config>             Config path',
    '  --db-path <db>              Database path',
    '  --profile                   Export local OTEL traces',
    '  --profile-endpoint <url>    OTLP endpoint',
    '  -h, --help                  Show help',
  ].join('\n')
}

export function formatProfileHelp() {
  return [
    'harbr profile - manage local profiling infrastructure',
    '',
    'Usage:',
    '  harbr profile up',
    '  harbr profile down',
    '  harbr profile status',
    '  harbr profile url',
    '',
    'Commands:',
    '  up        Start local Jaeger OTLP tracing',
    '  down      Stop local Jaeger OTLP tracing',
    '  status    Show local tracing container status',
    '  url       Print the Jaeger UI URL',
    '',
    'Trace with:',
    '  harbr --profile',
    '  harbr sync --profile',
  ].join('\n')
}

export function formatUnknownCommandHelp(command: string) {
  return [`unknown command: ${command}`, '', formatRootHelp()].join('\n')
}

export function formatVersion() {
  return packageInfo.version ? `harbr ${packageInfo.version}` : 'harbr'
}
