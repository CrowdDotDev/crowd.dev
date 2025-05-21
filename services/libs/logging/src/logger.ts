import * as Bunyan from 'bunyan'
import BunyanFormat from 'bunyan-format'

import { IS_DEV_ENV, IS_TEST_ENV, LOG_LEVEL, SERVICE } from '@crowd/common'

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
    name: SERVICE,
    level: LOG_LEVEL as Bunyan.LogLevel,
    stream: IS_DEV_ENV || IS_TEST_ENV || SERVICE === 'script' ? PRETTY_FORMAT : JSON_FORMAT,
  }

  serviceLoggerInstance = Bunyan.createLogger(options as unknown as Bunyan.LoggerOptions)
  if (!IS_DEV_ENV && !IS_TEST_ENV) {
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
