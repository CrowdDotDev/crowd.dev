import { OpenSearchService } from '@crowd/opensearch'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { Logger } from '@crowd/logging'

export interface IOpensearchRequest {
  opensearch: OpenSearchService
}

export const opensearchMiddleware = (parentLog: Logger): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const opensearchService = new OpenSearchService(parentLog)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(req as any).opensearchService = opensearchService
    next()
  }
}
