import {
  formatRootHelp,
  formatUnknownCommandHelp,
  formatVersion,
  isHelpRequest,
  isVersionRequest,
} from '~/cli/help'

const args = process.argv.slice(2)
const command = args[0]?.startsWith('-') ? undefined : args[0]
const commandArgs = command ? args.slice(1) : args

if (command === 'help' || (!command && isHelpRequest(args))) {
  console.log(formatRootHelp())
} else if (!command && isVersionRequest(args)) {
  console.log(formatVersion())
} else if (!command || command === 'tui') {
  if (isHelpRequest(commandArgs)) {
    console.log(formatRootHelp())
    process.exitCode = 0
  } else if (isVersionRequest(commandArgs)) {
    console.log(formatVersion())
    process.exitCode = 0
  } else {
    const { launchTui } = await import('./launch-tui')
    await launchTui(commandArgs)
  }
} else if (command === 'sync') {
  const { runSyncCommand } = await import('./commands/sync')
  await runSyncCommand(commandArgs)
} else if (command === 'profile') {
  const { runProfileCommand } = await import('./commands/profile')
  await runProfileCommand(commandArgs)
} else {
  console.error(formatUnknownCommandHelp(command))
  process.exitCode = 1
}
