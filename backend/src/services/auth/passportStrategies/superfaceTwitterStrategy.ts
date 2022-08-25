import { getConfig } from '../../../config'
import StaticPKCEStore from './staticPKCEStore'

const TwitterStrategy = require('@superfaceai/passport-twitter-oauth2')

export function getTwitterStrategy() {
  const staticPKCEStore = new StaticPKCEStore()
  return new TwitterStrategy(
    {
      clientID: process.env.AUTH_SOCIAL_TWITTER_CLIENT_ID,
      clientSecret: process.env.AUTH_SOCIAL_TWITTER_CLIENT_SECRET,
      callbackURL: `${getConfig().BACKEND_URL}/twitter/callback`,
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
