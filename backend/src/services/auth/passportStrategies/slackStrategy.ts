import fetch from 'node-fetch'
import SlackStrategy from 'passport-slack'
import { PlatformType } from '@crowd/types'
import { SLACK_CONFIG, API_CONFIG, SLACK_NOTIFIER_CONFIG } from '../../../conf'

export function getSlackStrategy(): SlackStrategy {
  return new SlackStrategy.Strategy(
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
export function getSlackNotifierStrategy(): SlackStrategy {
  return new SlackStrategy.Strategy(
    {
      clientID: SLACK_NOTIFIER_CONFIG.clientId,
      clientSecret: SLACK_NOTIFIER_CONFIG.clientSecret,
      callbackURL: `${API_CONFIG.url}/tenant/automation/slack/callback`,
      skipUserProfile: true,
    },
    (req, accessToken, webhookData, profile, done) => {
      if (!done) {
        throw new TypeError(
          'Missing req in verifyCallback; did you enable passReqToCallback in your strategy?',
        )
      }
      return done(null, {
        accessToken: webhookData.access_token,
        url: webhookData.incoming_webhook.url,
        configurationUrl: webhookData.incoming_webhook.url,
        channelId: webhookData.incoming_webhook.url,
        channelName: webhookData.incoming_webhook.channel,
      })
    },
  )
}
