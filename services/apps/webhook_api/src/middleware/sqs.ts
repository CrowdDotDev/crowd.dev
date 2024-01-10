import { SqsClient } from '@crowd/sqs'
import { NextFunction, Request, RequestHandler, Response } from 'express'

export interface ISqsRequest {
  sqs: SqsClient
}

export const sqsMiddleware = (sqs: SqsClient): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(req as any).sqs = sqs
    next()
  }
}
