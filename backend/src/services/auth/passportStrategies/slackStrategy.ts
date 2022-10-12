import fetch from 'node-fetch'
import { SLACK_CONFIG, API_CONFIG } from '../../../config'
import { PlatformType } from '../../../utils/platforms'

export function getSlackStrategy() {
  const SlackStrategy = require('passport-slack').Strategy

  return new SlackStrategy(
    {
      clientID: SLACK_CONFIG.clientId,
      clientSecret: SLACK_CONFIG.clientSecret,
      callbackURL: `${API_CONFIG.url}/slack/callback`,
      authorizationURL: 'https://slack.com/oauth/v2/authorize',
      tokenURL: 'https://slack.com/api/oauth.v2.access',
      skipUserProfile: true,
      passReqToCallback: true,
    },
    (req, accessToken, refreshToken, profile, done) => {
      if (!done) {
        throw new TypeError(
          'Missing req in verifyCallback; did you enable passReqToCallback in your strategy?',
        )
      }

      fetch('https://slack.com/api/team.info', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((res) => {
          const existingUser = req.user || {}
          console.log(`access token: ${accessToken}`)

          return done(null, {
            ...existingUser,
            [PlatformType.SLACK]: {
              botToken: accessToken,
              teamId: res.team.id,
            },
          })
        })
    },
  )
}
