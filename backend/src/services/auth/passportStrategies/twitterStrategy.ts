// import TwitterStrategy from '@superfaceai/passport-twitter-oauth2'
// import { RedisCache, RedisClient } from '@crowd/redis'
// import { Logger } from '@crowd/logging'
// import { API_CONFIG, TWITTER_CONFIG } from '../../../conf'
// import RedisPKCEStore from './redisPKCEStore'

// export function getTwitterStrategy(redis: RedisClient, logger: Logger): TwitterStrategy {
//   const redisPKCEStore = new RedisPKCEStore(new RedisCache('twitterPKCE', redis, logger))
//   return new TwitterStrategy(
//     {
//       clientID: TWITTER_CONFIG.clientId,
//       clientSecret: TWITTER_CONFIG.clientSecret,
//       callbackURL: `${API_CONFIG.url}/twitter/callback`,
//       clientType: 'private',
//       passReqToCallback: true,
//       store: redisPKCEStore,
//     },
//     (req, accessToken, refreshToken, profile, done) => {
//       if (!done) {
//         throw new TypeError(
//           'Missing req in verifyCallback; did you enable passReqToCallback in your strategy?',
//         )
//       }
//       const { provider } = profile
//       if (!provider) {
//         throw new TypeError('Missing strategy provider name')
//       }

//       const existingUser = req.user || {}

//       // We return the twitter profile
//       // to the callback endpoint /api/auth/social/twitter/callback
//       return done(null, {
//         ...existingUser,
//         displayName: profile.displayName,
//         [provider]: { profile, accessToken, refreshToken },
//       })
//     },
//   )
// }
