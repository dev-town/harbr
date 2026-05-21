export function readArgValue(args: string[], flag: string) {
  const flagIndex = args.indexOf(flag)
  return flagIndex >= 0 ? args[flagIndex + 1] : undefined
}
