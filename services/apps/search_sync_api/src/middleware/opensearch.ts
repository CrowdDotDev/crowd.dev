import { OpenSearchService } from '@crowd/opensearch'
import { NextFunction, Request, RequestHandler, Response } from 'express'

export interface IOpenSearchRequest {
  opensearch: OpenSearchService
}

export const opensearchMiddleware = (client: OpenSearchService): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(req as any).opensearch = client
    next()
  }
}
