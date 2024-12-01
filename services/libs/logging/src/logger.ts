import * as Bunyan from 'bunyan'
import BunyanFormat from 'bunyan-format'

import { ServiceEnvironment } from '@crowd/types'

import { Logger } from './types'

const PRETTY_FORMAT = new BunyanFormat({
  outputMode: 'short',
  levelInString: true,
})

const JSON_FORMAT = new BunyanFormat({
  outputMode: 'bunyan',
  levelInString: true,
})

let serviceLoggerInstance: Logger
export const getServiceLogger = (): Logger => {
  if (serviceLoggerInstance) return serviceLoggerInstance

  const options = {
    name: process.env.SERVICE || 'unknown-service',
    level: (process.env.LOG_LEVEL || 'info') as Bunyan.LogLevel,
    stream:
      process.env.NODE_ENV === undefined ||
      [ServiceEnvironment.TEST, ServiceEnvironment.DEVELOPMENT, ServiceEnvironment.DOCKER].includes(
        process.env.NODE_ENV as ServiceEnvironment,
      )
        ? PRETTY_FORMAT
        : JSON_FORMAT,
  }

  serviceLoggerInstance = Bunyan.createLogger(options as unknown as Bunyan.LoggerOptions)
  if (
    [ServiceEnvironment.PRODUCTION, ServiceEnvironment.STAGING].includes(
      process.env.NODE_ENV as ServiceEnvironment,
    )
  ) {
    delete serviceLoggerInstance.fields.hostname
  }

  return serviceLoggerInstance
}

export const getChildLogger = (
  name: string,
  parent: Logger,
  logProperties?: Record<string, unknown>,
): Logger => {
  const options = {
    component: name,
    ...(logProperties || {}),
  }

  return parent.child(options, true)
}

const serviceChildMap = new Map<string, Logger>()
export const getServiceChildLogger = (
  name: string,
  logProperties?: Record<string, unknown>,
): Logger => {
  if (serviceChildMap.has(name)) return serviceChildMap.get(name)

  const logger = getChildLogger(name, getServiceLogger(), logProperties)
  serviceChildMap.set(name, logger)
  return logger
}
