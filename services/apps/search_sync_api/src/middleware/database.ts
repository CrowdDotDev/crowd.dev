import { NextFunction, Request, RequestHandler, Response } from 'express'

import { DbConnection, DbStore } from '@crowd/data-access-layer/src/database'

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IDatabaseRequest {
  pgStore: DbStore
  qdbStore: DbStore
}

export const databaseMiddleware = (pgConn: DbConnection, qdbConn: DbConnection): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    ;(req as any).pgStore = new DbStore(req.log, pgConn)
    ;(req as any).qdbStore = new DbStore(req.log, qdbConn)
    next()
  }
}
