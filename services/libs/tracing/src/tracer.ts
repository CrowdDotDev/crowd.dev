import opentelemetry, { Tracer } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { Resource, ResourceAttributes } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

import {
  awsEc2Detector,
  awsEcsDetector,
  awsEksDetector,
} from '@opentelemetry/resource-detector-aws'

import { BunyanInstrumentation } from '@opentelemetry/instrumentation-bunyan'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk'
import { KafkaJsInstrumentation } from 'opentelemetry-instrumentation-kafkajs'
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4'
import { SequelizeInstrumentation } from 'opentelemetry-instrumentation-sequelize'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'

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

  // Apply specific resource attributes if process is running in Kubernetes.
  // This is not handled by AWS resource detectors.
  if (process.env['KUBE_MODE'] == '1') {
    attrs[SemanticResourceAttributes.K8S_POD_NAME] = process.env['HOSTNAME']
  }

  sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    resource: new Resource(attrs),
    autoDetectResources: true,
    resourceDetectors: [awsEc2Detector, awsEcsDetector, awsEksDetector],
    instrumentations: [
      new BunyanInstrumentation(),
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new AwsInstrumentation(),
      new KafkaJsInstrumentation(),
      new RedisInstrumentation(),
      new SequelizeInstrumentation(),
      new PgInstrumentation(),
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
