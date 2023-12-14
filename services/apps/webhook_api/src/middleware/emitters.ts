import { IntegrationStreamWorkerEmitter } from '@crowd/common_services'
import { NextFunction, Request, RequestHandler, Response } from 'express'

export interface IEmittersRequest {
  emitters: {
    integrationStreamWorker: IntegrationStreamWorkerEmitter
  }
}

export const emittersMiddleware = (
  integrationStreamWorker: IntegrationStreamWorkerEmitter,
): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(req as any).emitters = {
      integrationStreamWorker,
    }
    next()
  }
}
