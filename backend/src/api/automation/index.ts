import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
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
