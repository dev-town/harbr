import { useContext } from 'react'

import { TuiServicesContext } from '../../app-context'

export function useTuiServices() {
  const services = useContext(TuiServicesContext)

  if (!services) {
    throw new Error('Tui services missing')
  }

  return services
}
