export type TuiOptions = {
  configPath?: string
  dbPath?: string
  profile?: TuiProfileOptions
}

export type TuiProfileOptions = {
  endpoint: string
  sessionId: string
}
