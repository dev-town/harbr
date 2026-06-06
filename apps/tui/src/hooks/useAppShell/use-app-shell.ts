import { useEffect } from 'react'

import { loadProjects } from '../../actions/refresh'
import { tuiStore, useTuiStore } from '../../store'
import { useTuiServices } from '../useTuiServices'

export function useAppShell() {
  const services = useTuiServices()
  const notice = useTuiStore((state) => state.app.notice)

  useEffect(() => {
    void loadProjects(services, tuiStore)
  }, [services])

  return { notice }
}
