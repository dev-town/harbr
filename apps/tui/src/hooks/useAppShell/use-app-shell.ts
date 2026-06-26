import { useEffect } from 'react'

import { loadProjects } from '~/actions/refresh'
import { tuiStore, useTuiStore } from '~/store'
import { useTuiServices } from '~/hooks/useTuiServices'

export function useAppShell() {
  const services = useTuiServices()
  const notice = useTuiStore((state) => state.app.notice)

  useEffect(() => {
    void loadProjects(services, tuiStore)
  }, [services])

  useEffect(() => {
    if (!notice) {
      return
    }

    const noticeId = notice.id
    const timeout = setTimeout(() => {
      if (tuiStore.getState().app.notice?.id === noticeId) {
        tuiStore.getState().clearNotice()
      }
    }, 3500)

    return () => clearTimeout(timeout)
  }, [notice])
}
