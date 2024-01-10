import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { ApiRequest } from '.'
import { HttpStatusError } from '@crowd/common'

export const asyncWrap =
  (fn: (req: ApiRequest, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as ApiRequest, res, next)).catch(next)
  }

export const errorMiddleware = (): ErrorRequestHandler => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err, req, res, _next) => {
    const request = req as ApiRequest

    if (err instanceof HttpStatusError) {
      request.log.error(err, { statusCode: err.status }, 'HTTP status error occured!')
      res.status(err.status).send(err.message)
    } else {
      request.log.error(err, 'Unknown error occured!')
      res.status(500).send('Internal Server Error')
    }
  }
}
