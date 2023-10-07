import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(
    `/tenant/invitation/:token/accept`,
    safeWrap(require('./tenantInvitationAccept').default),
  )
  app.delete(
    `/tenant/invitation/:token/decline`,
    safeWrap(require('./tenantInvitationDecline').default),
  )
  app.post(`/tenant`, safeWrap(require('./tenantCreate').default))
  app.put(`/tenant/:id`, safeWrap(require('./tenantUpdate').default))
  app.delete(`/tenant`, safeWrap(require('./tenantDestroy').default))
  app.get(`/tenant`, safeWrap(require('./tenantList').default))
  app.get(`/tenant/url`, safeWrap(require('./tenantFind').default))
  app.get(`/tenant/:id`, safeWrap(require('./tenantFind').default))
  app.get(`/tenant/:tenantId/membersToMerge`, safeWrap(require('./tenantMembersToMerge').default))
  app.get(
    `/tenant/:tenantId/organizationsToMerge`,
    safeWrap(require('./tenantOrganizationsToMerge').default),
  )
  app.post(`/tenant/:tenantId/sampleData`, safeWrap(require('./tenantGenerateSampleData').default))
  app.delete(`/tenant/:tenantId/sampleData`, safeWrap(require('./tenantDeleteSampleData').default))
}
