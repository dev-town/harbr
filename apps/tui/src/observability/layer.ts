import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as Otlp from '@effect/opentelemetry/Otlp'
import { Layer } from 'effect'

import packageJson from '../../package.json'
import type { TuiProfileOptions } from '~/types'

const packageInfo = packageJson as { version?: string }

export function makeObservabilityLayer(profile: TuiProfileOptions) {
  return Otlp.layerJson({
    baseUrl: profile.endpoint,
    resource: {
      serviceName: 'harbr',
      serviceVersion: packageInfo.version,
      attributes: {
        'harbr.profile.session_id': profile.sessionId,
      },
    },
    loggerExcludeLogSpans: true,
    shutdownTimeout: '3 seconds',
    tracerExportInterval: '500 millis',
  }).pipe(Layer.provide(FetchHttpClient.layer))
}
