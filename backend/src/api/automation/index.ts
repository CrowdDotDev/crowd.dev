import { safeWrap } from '../../middlewares/errorMiddleware'
import { featureFlagMiddleware } from '../../middlewares/featureFlagMiddleware'
import { FeatureFlag } from '../../types/common'

export default (app) => {
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
