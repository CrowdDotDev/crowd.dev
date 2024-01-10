import { DbConnection, DbStore } from '@crowd/database'
import { NextFunction, Request, RequestHandler, Response } from 'express'

export interface IDatabaseRequest {
  dbStore: DbStore
}

export const databaseMiddleware = (conn: DbConnection): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(req as any).dbStore = new DbStore(req.log, conn)
    next()
  }
}
