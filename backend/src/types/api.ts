import type { Request } from 'express'

/**
 * Auth-method-agnostic caller identity. Every auth strategy
 * (bearer token, API key, user OAuth) resolves to this interface.
 * Route handlers only interact with Actor — never raw tokens.
 */
export interface Actor {
  type: 'machine' | 'user'
  id: string
  scopes: string[]
}

export interface ApiRequest extends Request {
  actor: Actor
}
