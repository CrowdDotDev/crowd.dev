import passport from 'passport'

import { API_CONFIG } from '../../conf'
import { authMiddleware } from '../../middlewares/authMiddleware'
import { safeWrap } from '../../middlewares/errorMiddleware'
import { getSlackNotifierStrategy } from '../../services/auth/passportStrategies/slackStrategy'
import TenantService from '../../services/tenantService'

export default (app) => {
  app.get(
    '/tenant/:tenantId/automation/slack',
    safeWrap(require('./automationSlackConnect').default),
  )
  app.get(
    '/tenant/automation/slack/callback',
    passport.authorize(getSlackNotifierStrategy(), {
      session: false,
      failureRedirect: `${API_CONFIG.frontendUrl}/settings?activeTab=automations&error=true`,
    }),
    (req, _res, next) => {
      const { crowdToken } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
      req.headers.authorization = `Bearer ${crowdToken}`
      next()
    },
    authMiddleware,
    async (req, _res, next) => {
      const { tenantId } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
      req.currentTenant = await new TenantService(req).findById(tenantId)
      next()
    },
    safeWrap(require('./automationSlackCallback').default),
  )
  app.post('/tenant/:tenantId/automation', safeWrap(require('./automationCreate').default))
  app.put(
    '/tenant/:tenantId/automation/:automationId',
    safeWrap(require('./automationUpdate').default),
  )
  app.delete(
    '/tenant/:tenantId/automation/:automationId',
    safeWrap(require('./automationDestroy').default),
  )
  app.get(
    '/tenant/:tenantId/automation/:automationId/executions',
    safeWrap(require('./automationExecutionFind').default),
  )
  app.get(
    '/tenant/:tenantId/automation/:automationId',
    safeWrap(require('./automationFind').default),
  )
  app.get('/tenant/:tenantId/automation', safeWrap(require('./automationList').default))
}
