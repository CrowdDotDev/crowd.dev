export default (app) => {
  app.post(`/tenant/invitation/:token/accept`, require('./tenantInvitationAccept').default)
  app.delete(`/tenant/invitation/:token/decline`, require('./tenantInvitationDecline').default)
  app.post(`/tenant`, require('./tenantCreate').default)
  app.put(`/tenant/:id`, require('./tenantUpdate').default)
  app.delete(`/tenant`, require('./tenantDestroy').default)
  app.get(`/tenant`, require('./tenantList').default)
  app.get(`/tenant/url`, require('./tenantFind').default)
  app.get(`/tenant/:id`, require('./tenantFind').default)
  app.get(`/tenant/:id/membersToMerge`, require('./tenantMembersToMerge').default)
  app.post(`/tenant/:tenantId/sampleData`, require('./tenantGenerateSampleData').default)
  app.delete(`/tenant/:tenantId/sampleData`, require('./tenantDeleteSampleData').default)
}
