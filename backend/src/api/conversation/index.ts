export default (app) => {
  app.post(`/tenant/:tenantId/conversation`, require('./conversationCreate').default)
  app.put(`/tenant/:tenantId/conversation/:id`, require('./conversationUpdate').default)
  app.delete(`/tenant/:tenantId/conversation`, require('./conversationDestroy').default)
  app.get(`/tenant/:tenantId/conversation`, require('./conversationList').default)
  app.get(`/tenant/:tenantId/conversation/:id`, require('./conversationFind').default)
  app.post(
    `/tenant/:tenantId/conversation/settings`,
    require('./conversationSettingsUpdate').default,
  )
}
