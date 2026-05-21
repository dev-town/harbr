import { theme } from '../../config/theme'

type NoticeLineProps = {
  notice: string
}

export function NoticeLine({ notice }: NoticeLineProps) {
  return (
    <box marginTop={1} width="100%">
      <text>
        <span fg={theme.error}> </span>
        <span fg={theme.error}>{notice}</span>
      </text>
    </box>
  )
}
