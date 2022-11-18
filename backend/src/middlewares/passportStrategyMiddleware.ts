import passport from 'passport'
import { TWITTER_CONFIG, SLACK_CONFIG } from '../config'
import { getTwitterStrategy } from '../services/auth/passportStrategies/twitterStrategy'
import { getSlackStrategy } from '../services/auth/passportStrategies/slackStrategy'
import { getServiceLogger } from '../utils/logging'

const log = getServiceLogger()

export async function passportStrategyMiddleware(req, res, next) {
  try {
    if (TWITTER_CONFIG.clientId) {
      passport.use(getTwitterStrategy(req.redis))
    }

    if (SLACK_CONFIG.clientId) {
      passport.use(getSlackStrategy())
    }
  } catch (error) {
    log.error(error, 'Error connecting to redis!')
  } finally {
    next()
  }
}
