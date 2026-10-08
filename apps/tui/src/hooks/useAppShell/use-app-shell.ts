import { useEffect, useLayoutEffect, useRef } from 'react'

import { loadProjects } from '~/actions/refresh'
import { tuiStore, useTuiStore } from '~/store'
import { useTuiServices } from '~/hooks/useTuiServices'

export function useAppShell() {
  const services = useTuiServices()
  const notice = useTuiStore((state) => state.app.notice)
  const isLoading = useTuiStore((state) => state.app.isLoading)
  const activeRuntimeCount = useTuiStore((state) => state.data.activeRuntimeRows.length)
  const projectCount = useTuiStore((state) => state.data.projectRows.length)
  const hasCommittedResults = useRef(false)

  useLayoutEffect(() => {
    services.startupTelemetry.mark('ui.app_committed')
    services.startupTelemetry.markOnNextFrame('ui.app_painted')
  }, [services])

  useEffect(() => {
    void loadProjects(services, tuiStore)
  }, [services])

  useEffect(() => {
    if (isLoading || hasCommittedResults.current) {
      return
    }

    hasCommittedResults.current = true
    const attributes = {
      'data.active_runtime_count': activeRuntimeCount,
      'data.project_count': projectCount,
    }
    services.startupTelemetry.mark('ui.results_committed', attributes)
    services.startupTelemetry.completeOnNextFrame(attributes)
  }, [activeRuntimeCount, isLoading, projectCount, services])

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
