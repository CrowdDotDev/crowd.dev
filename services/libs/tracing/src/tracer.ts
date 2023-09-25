import fs from 'fs'

import opentelemetry, { Tracer } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { Resource, ResourceAttributes } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

import { BunyanInstrumentation } from '@opentelemetry/instrumentation-bunyan'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk'
import { SequelizeInstrumentation } from 'opentelemetry-instrumentation-sequelize'

let sdk: NodeSDK | undefined
let isInitialized = false

export const getServiceTracer = (): Tracer => {
  const service = process.env['SERVICE']
  if (!service) {
    throw new Error('Environment variable `SERVICE` is not set')
  }

  if (isInitialized) {
    return opentelemetry.trace.getTracer(service)
  }

  const attrs: ResourceAttributes = {
    [SemanticResourceAttributes.SERVICE_NAME]: service,
  }

  // Try to retrieve the Kubernetes namespace from file. If found, we can assume
  // service is running in Kubernetes so we can set other Kubernetes-related
  // resources such as pod and deployment names.
  try {
    const data = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace')
    if (data) {
      attrs[SemanticResourceAttributes.K8S_NAMESPACE_NAME] = data.toString()

      const pod = process.env['HOSTNAME']
      if (pod) {
        attrs[SemanticResourceAttributes.K8S_POD_NAME] = pod
        attrs[SemanticResourceAttributes.K8S_DEPLOYMENT_NAME] = `${service}-dpl`
      }
    }
  } catch (err) {
    console.log('Ignoring Kubernetes tracing resources...')
  }

  sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    resource: new Resource(attrs),
    autoDetectResources: true,
    instrumentations: [
      new BunyanInstrumentation(),
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new AwsInstrumentation(),
      new SequelizeInstrumentation(),
    ],
  })

  isInitialized = true
  sdk.start()
  return opentelemetry.trace.getTracer(service)
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
