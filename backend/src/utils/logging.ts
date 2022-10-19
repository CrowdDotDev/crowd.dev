import * as Bunyan from 'bunyan'
import BunyanFormat from 'bunyan-format'
import { LOG_LEVEL, IS_DEV_ENV, IS_TEST_ENV, SERVICE } from '../config/index'

export type Logger = Bunyan

const PRETTY_FORMAT = new BunyanFormat({ outputMode: 'short', levelInString: true })
const JSON_FORMAT = new BunyanFormat({ outputMode: 'bunyan', levelInString: true })

let serviceLoggerInstance: Bunyan

export const createServiceLogger = (): Logger => {
  if (serviceLoggerInstance) return serviceLoggerInstance

  const options = {
    name: SERVICE,
    level: LOG_LEVEL as Bunyan.LogLevel,
    stream: IS_DEV_ENV || IS_TEST_ENV ? PRETTY_FORMAT : JSON_FORMAT,
  }

  serviceLoggerInstance = Bunyan.createLogger(options)
  return serviceLoggerInstance
}

export const getServiceLogger = (): Logger => {
  if (serviceLoggerInstance) return serviceLoggerInstance
  return createServiceLogger()
}

export const createChildLogger = (
  childName: string,
  parentLogger: Logger,
  logProperties?: any,
): Logger => {
  const options = {
    component: childName,
    ...(logProperties || {}),
  }

  return parentLogger.child(options, true)
}
