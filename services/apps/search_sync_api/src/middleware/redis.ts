import { RedisClient } from '@crowd/redis'
import { NextFunction, Request, RequestHandler, Response } from 'express'

export interface IRedisRequest {
  redisClient: RedisClient
}

export const redisMiddleware = (client: RedisClient): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(req as any).redisClient = client
    next()
  }
}
