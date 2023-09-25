// Importing and initializing the tracer here allows to import and initialize
// OpenTelemetry instrumentations for Bunyan **before** importing the logging
// library. Otherwise, automatic instrumentation and correlation with the logger
// won't work. Since the logger is the first library imported on services, this
// also allows to leverage automatic instrumentation for other libraries such as
// Sequelize, Express, and SQS. Details:
// https://opentelemetry.io/blog/2022/troubleshooting-nodejs/#enable-before-require
import { getServiceTracer } from '@crowd/tracing'
getServiceTracer()

export * from './logError'
export * from './logger'
export * from './loggerBase'
export * from './types'
export * from './utility'
