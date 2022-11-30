/* eslint-disable class-methods-use-this */
/* eslint-disable consistent-return */

import { v4 as uuid } from 'uuid'
import { RedisCache } from '../../../utils/redis'

/**
 * This class is a re-implementation of
 * https://github.com/jaredhanson/passport-oauth2/blob/master/lib/state/pkcesession.js
 * PKCE (Proof Key for Code Exchange) is a mechanism that makes OAuth2.0 Authorization Code grant
 * more secure to man in the middle attacks. It prevents the OAuth2 from happening when the authorization code
 * is leaked, and a third party tries to get access token using this leaked authorization code.
 * Original implementation was requiring sessions. But since we're making the authorization
 * on the backend, we didn't want sessions to keep the api stateless.
 * PKCE state is kept on a redis instance.
 *
 */
class RedisPKCEStore {
  verifier: String

  state: String

  cache: RedisCache

  constructor(redisCache: RedisCache) {
    this.cache = redisCache
    this.verifier = ''
    this.state = ''
  }

  store(req, verifier, state, meta, callback): void {
    if (!req.redis) {
      return callback(new Error('OAuth 2.0 authentication with PKCE requires redis support.'))
    }

    if (!state.userId) {
      return callback(new Error('userId in state is required for PKCE check.'))
    }

    let sstate = {
      handle: uuid(),
      code_verifier: verifier,
    } as any

    if (state) {
      sstate = { ...sstate, ...state }
    }

    const stateSearchParams = new URLSearchParams({
      handle: sstate.handle,
      userId: state.userId,
      crowdToken: state.crowdToken,
      tenantId: state.tenantId,
      redirectUrl: state.redirectUrl,
    }).toString()

    this.cache.setValue(req.currentUser.id, JSON.stringify(sstate), 300).then(() => {
      callback(null, stateSearchParams)
    })
  }

  verify(req, providedState, callback) {
    if (!req.redis) {
      return callback(new Error('OAuth 2.0 authentication with PKCE requires redis support.'))
    }

    const params = new URLSearchParams(providedState)
    const handle = params.get('handle')
    const userId = params.get('userId')

    this.cache.getValue(userId).then((existingValue) => {
      if (!existingValue) {
        return callback(null, false, { message: 'Unable to verify authorization request state.' })
      }

      const stateObj = JSON.parse(existingValue)

      this.cache.delete(userId).then(() => {
        if (stateObj.handle !== handle) {
          return callback(null, false, { message: 'Invalid authorization request state.' })
        }

        return callback(null, stateObj.code_verifier, stateObj)
      })
    })
  }
}

export default RedisPKCEStore
