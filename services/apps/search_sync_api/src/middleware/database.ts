import { NextFunction, Request, RequestHandler, Response } from 'express'

import { DbConnection, DbStore } from '@crowd/data-access-layer/src/database'

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IDatabaseRequest {
  pgStore: DbStore
}

export const databaseMiddleware = (pgConn: DbConnection): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    ;(req as any).pgStore = new DbStore(req.log, pgConn)
    next()
  }
}
