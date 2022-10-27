export default (app) => {
  app.post(`/tenant/:tenantId/member/query`, require('./memberQuery').default)
  app.post(`/tenant/:tenantId/member`, require('./memberCreate').default)
  app.put(`/tenant/:tenantId/member/:id`, require('./memberUpdate').default)
  app.post(`/tenant/:tenantId/member/import`, require('./memberImport').default)
  app.delete(`/tenant/:tenantId/member`, require('./memberDestroy').default)
  app.get(`/tenant/:tenantId/member/autocomplete`, require('./memberAutocomplete').default)
  app.get(`/tenant/:tenantId/member`, require('./memberList').default)
  app.get(`/tenant/:tenantId/member/:id`, require('./memberFind').default)
  app.put(`/tenant/:tenantId/member/:memberId/merge`, require('./memberMerge').default)
  app.put(`/tenant/:tenantId/member/:memberId/no-merge`, require('./memberNotMerge').default)
  app.patch(`/tenant/:tenantId/member`, require('./memberUpdateBulk').default)
}
