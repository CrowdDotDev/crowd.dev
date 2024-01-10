import { Logger, getChildLogger } from '@crowd/logging'
import bunyanMiddleware from 'bunyan-middleware'
import { RequestHandler } from 'express'

export interface ILoggingRequest {
  log: Logger
}

export const loggingMiddleware = (log: Logger): RequestHandler => {
  return bunyanMiddleware({
    headerName: 'x-request-id',
    propertyName: 'requestId',
    logName: `requestId`,
    logger: getChildLogger('apiRequest', log),
    level: 'trace',
  })
}
