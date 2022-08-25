import fetch from 'node-fetch'
import { getConfig } from '../../../config'

export function getSlackStrategy() {
  const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET } = getConfig()
  const SlackStrategy = require('passport-slack').Strategy

  return new SlackStrategy(
    {
      clientID: SLACK_CLIENT_ID,
      clientSecret: SLACK_CLIENT_SECRET,
      callbackURL: `${getConfig().BACKEND_URL}/slack/callback`,
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
            slack: {
              botToken: accessToken,
              teamId: res.team.id,
            },
          })
        })
    },
  )
}
