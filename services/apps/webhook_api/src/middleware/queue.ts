import { IQueue } from '@crowd/queue'
import { NextFunction, Request, RequestHandler, Response } from 'express'

export interface IQueueRequest {
  queue: IQueue
}

export const queueMiddleware = (queue: IQueue): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(req as any).queue = queue
    next()
  }
}
