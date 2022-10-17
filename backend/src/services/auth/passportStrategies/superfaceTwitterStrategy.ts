import { API_CONFIG, TWITTER_CONFIG } from '../../../config'
import StaticPKCEStore from './staticPKCEStore'

const TwitterStrategy = require('@superfaceai/passport-twitter-oauth2')

export function getTwitterStrategy() {
  const staticPKCEStore = new StaticPKCEStore()
  return new TwitterStrategy(
    {
      clientID: TWITTER_CONFIG.clientId,
      clientSecret: TWITTER_CONFIG.clientSecret,
      callbackURL: `${API_CONFIG.url}/twitter/callback`,
      clientType: 'private',
      passReqToCallback: true,
      store: staticPKCEStore,
    },
    (req, accessToken, refreshToken, profile, done) => {
      if (!done) {
        throw new TypeError(
          'Missing req in verifyCallback; did you enable passReqToCallback in your strategy?',
        )
      }
      const { provider } = profile
      if (!provider) {
        throw new TypeError('Missing strategy provider name')
      }

      const existingUser = req.user || {}

      // We return the twitter profile
      // to the callback endpoint /api/auth/social/twitter/callback
      return done(null, {
        ...existingUser,
        displayName: profile.displayName,
        [provider]: { profile, accessToken, refreshToken },
      })
    },
  )
}
