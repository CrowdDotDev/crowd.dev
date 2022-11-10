import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/conversation`, safeWrap(require('./conversationCreate').default))
  app.put(`/tenant/:tenantId/conversation/:id`, safeWrap(require('./conversationUpdate').default))
  app.delete(`/tenant/:tenantId/conversation`, safeWrap(require('./conversationDestroy').default))
  app.post(`/tenant/:tenantId/conversation/query`, safeWrap(require('./conversationQuery').default))
  app.get(`/tenant/:tenantId/conversation`, safeWrap(require('./conversationList').default))
  app.get(`/tenant/:tenantId/conversation/:id`, safeWrap(require('./conversationFind').default))
  app.post(
    `/tenant/:tenantId/conversation/settings`,
    safeWrap(require('./conversationSettingsUpdate').default),
  )
}
