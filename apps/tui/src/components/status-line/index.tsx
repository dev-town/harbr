type StatusLineProps = {
  color: string
  icon: string
  text: string
}

export function StatusLine({ color, icon, text }: StatusLineProps) {
  return (
    <box paddingLeft={1} width="100%">
      <text>
        <span fg={color}>{icon} </span>
        <span fg={color}>{text}</span>
      </text>
    </box>
  )
}
