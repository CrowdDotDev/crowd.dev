import type { Request } from 'express'
import type { JWTPayload } from 'express-oauth2-jwt-bearer'

/**
 * JWT payload from Auth0 including optional scopes and client ID.
 */
export interface Auth0TokenPayload extends JWTPayload {
  azp?: string
  scope?: string
}

/**
 * Auth-method-agnostic caller identity. Every auth strategy
 * (bearer token, API key, user OAuth) resolves to this interface.
 * Route handlers only interact with Actor — never raw tokens.
 */
export interface Actor {
  type: 'service' | 'user'
  id: string
  scopes: string[]
}

/**
 * Express request with authenticated actor
 * Use req.actor to check identity and permissions
 */
export interface ApiRequest extends Request {
  actor: Actor
}
