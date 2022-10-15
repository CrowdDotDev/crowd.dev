import * as Bunyan from 'bunyan'
import BunyanFormat from 'bunyan-format'
import { LOG_LEVEL, IS_DEV_ENV, IS_TEST_ENV, SERVICE } from '../config/index'

export type Logger = Bunyan

const PRETTY_FORMAT = new BunyanFormat({ outputMode: 'short', levelInString: true })
const JSON_FORMAT = new BunyanFormat({ outputMode: 'bunyan', levelInString: true })

let serviceLoggerInstance: Bunyan

export const getServiceLogger = (): Logger => {
  if (serviceLoggerInstance) return serviceLoggerInstance
  throw new Error('Service logger was not created on boot!')
}

export const createServiceLogger = (logProperties?: any): Logger => {
  if (serviceLoggerInstance) return serviceLoggerInstance

  const options = {
    name: 'service',
    service: SERVICE,
    level: LOG_LEVEL,
    stream: IS_DEV_ENV || IS_TEST_ENV ? PRETTY_FORMAT : JSON_FORMAT,
    ...(logProperties || {}),
  }

  serviceLoggerInstance = Bunyan.createLogger(options)
  return serviceLoggerInstance
}

export const createChildLogger = (
  parentLogger: Logger,
  childName: string,
  logProperties?: any,
): Logger => {
  const component =
    parentLogger.fields.component !== undefined
      ? `${parentLogger.fields.component}/${childName}`
      : childName

  const options = {
    component,
    ...(logProperties || {}),
  }

  return parentLogger.child(options, true)
}
