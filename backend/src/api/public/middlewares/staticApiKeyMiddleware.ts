import type { NextFunction, Request, RequestHandler, Response } from 'express'

import { UnauthorizedError } from '@crowd/common'

import type { DevStatsConfiguration } from '@/conf/configTypes'

export function staticApiKeyMiddleware(config: DevStatsConfiguration): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next(new UnauthorizedError('Missing or invalid Authorization header'))
      return
    }

    const providedKey = authHeader.slice('Bearer '.length)

    if (providedKey !== config.apiKey) {
      next(new UnauthorizedError('Invalid API key'))
      return
    }

    req.actor = { id: 'devstats', type: 'service', scopes: [] }

    next()
  }
}
