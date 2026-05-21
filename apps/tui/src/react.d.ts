declare module 'react' {
  export type ReactNode = unknown
  export type Context<T> = {
    Provider: (props: { value: T; children?: ReactNode }) => ReactNode
  }
  export function createContext<T>(defaultValue: T): Context<T>
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void
  export function useContext<T>(context: Context<T>): T
  export function useRef<T>(initialValue: T): { current: T }
}
