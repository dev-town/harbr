const args = process.argv.slice(2)
const command = args[0]?.startsWith('-') ? undefined : args[0]
const commandArgs = command ? args.slice(1) : args

if (!command || command === 'tui') {
  const { launchTui } = await import('./launch-tui')
  await launchTui(commandArgs)
} else if (command === 'sync') {
  const { runSyncCommand } = await import('./commands/sync')
  await runSyncCommand(commandArgs)
} else {
  console.error(formatHelp(command))
  process.exitCode = 1
}

function formatHelp(command: string) {
  return [
    `unknown command: ${command}`,
    '',
    'usage:',
    '  harbour [--path <config>] [--db-path <db>]',
    '  harbour tui [--path <config>] [--db-path <db>]',
    '  harbour sync [--json] [--path <config>] [--db-path <db>]',
  ].join('\n')
}
