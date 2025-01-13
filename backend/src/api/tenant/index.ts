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
  app.put(`/tenant/:tenantId`, safeWrap(require('./tenantUpdate').default))
  app.delete(`/tenant`, safeWrap(require('./tenantDestroy').default))
  app.get(`/tenant`, safeWrap(require('./tenantList').default))
  app.get(`/tenant/url`, safeWrap(require('./tenantFind').default))
  app.get(`/tenant/:tenantId`, safeWrap(require('./tenantFind').default))
  app.get(`/tenant/:tenantId/name`, safeWrap(require('./tenantFindName').default))
  app.post(`/tenant/:tenantId/membersToMerge`, safeWrap(require('./tenantMembersToMerge').default))
  app.post(
    `/tenant/:tenantId/organizationsToMerge`,
    safeWrap(require('./tenantOrganizationsToMerge').default),
  )
  app.post(
    `/tenant/:tenantId/viewOrganizations`,
    safeWrap(require('./tenantViewOrganizations').default),
  )
  app.post(`/tenant/:tenantId/viewContacts`, safeWrap(require('./tenantViewContacts').default))
}
