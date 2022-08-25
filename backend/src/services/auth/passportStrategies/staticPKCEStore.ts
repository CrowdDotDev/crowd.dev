/**
 * This class is a re-implementation of
 * https://github.com/jaredhanson/passport-oauth2/blob/master/lib/state/pkcesession.js
 * PKCE (Proof Key for Code Exchange) is a mechanism that makes OAuth2.0 Authorization Code grant
 * more secure in certain cases. It prevents the OAuth2 from happening when the authorization code
 * is leaked, and a third party tries to get access token using this leaked authorization code.
 * We're simply bypassing the functionality because in passport.js it was implemented
 * using sessions and we'd like to keep our backend stateless for now.
 * In the future this may be implemented using postgres db possibly
 *
 */
class StaticPKCEStore {
  verifier: String

  state: String

  constructor() {
    this.verifier = ''
    this.state = ''
  }

  store(req, verifier, state, meta, callback) {
    this.verifier = verifier
    this.state = Buffer.from(JSON.stringify(state)).toString('base64')

    callback(null, this.state)
  }

  verify(req, providedState, callback) {
    return callback(null, this.verifier, this.state)
  }
}

export default StaticPKCEStore
