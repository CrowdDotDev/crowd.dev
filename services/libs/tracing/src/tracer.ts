import opentelemetry, { Tracer } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

let sdk: NodeSDK | undefined
let isSet = false

export const getServiceTracer = (service: string, version: string): Tracer => {
  if (isSet) {
    return opentelemetry.trace.getTracer(service, version)
  }

  sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: service,
      [SemanticResourceAttributes.SERVICE_VERSION]: version,
    }),
  })

  isSet = true
  sdk.start()
  return opentelemetry.trace.getTracer(service, version)
}

process.on('SIGTERM', async () => {
  await gracefulShutdown()
})

process.on('SIGINT', async () => {
  await gracefulShutdown()
})

async function gracefulShutdown() {
  try {
    await sdk.shutdown()
    console.log('Tracing successfully finished')
  } catch (err) {
    console.log('Error terminating tracing', err)
  } finally {
    process.exit(0)
  }
}
