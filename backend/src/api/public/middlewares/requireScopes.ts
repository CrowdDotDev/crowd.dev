import { InsufficientScopeError, UnauthorizedError } from '@crowd/common'

import type { ApiRequest } from '@/types/api'

export type Scope =
  | 'read:identities'
  | 'write:identities'
  | 'read:roles'
  | 'write:roles'
  | 'read:work-experiences'
  | 'write:work-experiences'
  | 'read:project-affiliations'
  | 'write:project-affiliations'

export const requireScopes =
  (required: Scope[], mode: 'all' | 'any' = 'all') =>
  (req: ApiRequest, _res, next) => {
    if (!req.actor) throw new UnauthorizedError()

    const granted = new Set(req.actor.scopes)
    const hasAccess =
      mode === 'all' ? required.every((s) => granted.has(s)) : required.some((s) => granted.has(s))

    if (!hasAccess) throw new InsufficientScopeError()

    next()
  }
