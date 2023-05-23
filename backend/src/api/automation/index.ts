import passport from 'passport'
import { safeWrap } from '../../middlewares/errorMiddleware'
import { featureFlagMiddleware } from '../../middlewares/featureFlagMiddleware'
import { FeatureFlag } from '../../types/common'
import { API_CONFIG } from '../../conf'
import { authMiddleware } from '../../middlewares/authMiddleware'
import TenantService from '../../services/tenantService'
import { getSlackNotifierStrategy } from '../../services/auth/passportStrategies/slackStrategy'

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
  app.post(
    '/tenant/:tenantId/automation',
    featureFlagMiddleware(FeatureFlag.AUTOMATIONS, 'entities.automation.errors.planLimitExceeded'),
    safeWrap(require('./automationCreate').default),
  )
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
