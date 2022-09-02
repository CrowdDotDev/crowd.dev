export default (app) => {
  app.post('/tenant/:tenantId/automation', require('./automationCreate').default)
  app.put('/tenant/:tenantId/automation/:automationId', require('./automationUpdate').default)
  app.delete('/tenant/:tenantId/automation/:automationId', require('./automationDestroy').default)
  app.get(
    '/tenant/:tenantId/automation/:automationId/history',
    require('./automationHistory').default,
  )
  app.get('/tenant/:tenantId/automation/:automationId', require('./automationFind').default)
  app.get('/tenant/:tenantId/automation', require('./automationList').default)
}
