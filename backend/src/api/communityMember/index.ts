export default (app) => {
  app.post(`/tenant/:tenantId/community-member`, require('./communityMemberCreate').default)
  app.put(`/tenant/:tenantId/community-member/:id`, require('./communityMemberUpdate').default)
  app.post(`/tenant/:tenantId/community-member/import`, require('./communityMemberImport').default)
  app.delete(`/tenant/:tenantId/community-member`, require('./communityMemberDestroy').default)
  app.get(
    `/tenant/:tenantId/community-member/autocomplete`,
    require('./communityMemberAutocomplete').default,
  )
  app.get(`/tenant/:tenantId/community-member`, require('./communityMemberList').default)
  app.get(`/tenant/:tenantId/community-member/:id`, require('./communityMemberFind').default)
  app.put(
    `/tenant/:tenantId/community-member/:memberId/merge`,
    require('./communityMemberMerge').default,
  )
  app.put(
    `/tenant/:tenantId/community-member/:memberId/no-merge`,
    require('./communityMemberNotMerge').default,
  )
  app.patch(`/tenant/:tenantId/community-member`, require('./communityMemberUpdateBulk').default)
}
