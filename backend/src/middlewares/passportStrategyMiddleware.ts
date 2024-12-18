import passport from 'passport'

import { getServiceLogger } from '@crowd/logging'

import { GITHUB_CONFIG, GOOGLE_CONFIG, SLACK_CONFIG } from '../conf'
import { getGithubStrategy } from '../services/auth/passportStrategies/githubStrategy'
import { getGoogleStrategy } from '../services/auth/passportStrategies/googleStrategy'
import { getSlackStrategy } from '../services/auth/passportStrategies/slackStrategy'

const log = getServiceLogger()

export async function passportStrategyMiddleware(req, res, next) {
  try {
    // if (TWITTER_CONFIG.clientId) {
    //   passport.use(getTwitterStrategy(req.redis, req.log))
    // }

    if (SLACK_CONFIG.clientId) {
      passport.use(getSlackStrategy())
    }

    if (GOOGLE_CONFIG.clientId) {
      passport.use(getGoogleStrategy())
    }

    if (GITHUB_CONFIG.clientId) {
      passport.use(getGithubStrategy())
    }
  } catch (error) {
    log.error(error, 'Error getting some passport strategies!')
  } finally {
    next()
  }
}
