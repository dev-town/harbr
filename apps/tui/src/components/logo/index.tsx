import { theme } from '../../config/theme'

export function Logo() {
  return (
    <text fg={theme.muted}>
      <strong>⣇⣸ ⣎⣱ ⣏⡱ ⣏⡱ ⡎⢱ ⡇⢸ ⣏⡱</strong>
      <br />
      <strong>⠇⠸ ⠇⠸ ⠇⠱ ⠧⠜ ⠣⠜ ⠣⠜ ⠇⠱</strong>
    </text>
  )
}

export function Logo2() {
  return (
    <text fg={theme.muted}>
      <strong>┓┏┏┓┳┓┳┓┏┓┳┳┳┓</strong>
      <br />
      <strong>┣┫┣┫┣┫┣┫┃┃┃┃┣┫</strong>
      <br />
      <strong>┛┗┛┗┛┗┻┛┗┛┗┛┛┗</strong>
    </text>
  )
}
