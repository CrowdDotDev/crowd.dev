import { SLACK_CONFIG } from '../../conf/index'
import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  if (SLACK_CONFIG.appId && SLACK_CONFIG.appToken && SLACK_CONFIG.teamId) {
    app.post('/slack/commands', safeWrap(require('./command').default))
  }
}
