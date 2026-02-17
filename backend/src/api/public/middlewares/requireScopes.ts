import type { NextFunction, Response } from 'express'

import { InsufficientScopeError, UnauthorizedError } from '@crowd/common'

import type { ApiRequest } from '@/types/api'

export type Scope =
  | 'read:members'
  | 'read:identities'
  | 'write:identities'
  | 'read:roles'
  | 'read:work-experiences'
  | 'write:work-experiences'
  | 'read:projects-affiliations'
  | 'write:projects-affiliations'

export const requireScopes =
  (required: Scope[], mode: 'all' | 'any' = 'all') =>
  (req: ApiRequest, _res: Response, next: NextFunction) => {
    if (!req.actor) {
      next(new UnauthorizedError())
      return
    }

    const granted = new Set(req.actor.scopes)
    const hasAccess =
      mode === 'all' ? required.every((s) => granted.has(s)) : required.some((s) => granted.has(s))

    if (!hasAccess) {
      next(new InsufficientScopeError())
      return
    }

    next()
  }
