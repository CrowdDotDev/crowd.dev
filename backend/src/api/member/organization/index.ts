import { safeWrap } from '@/middlewares/errorMiddleware'

export default (app) => {
  // Member Organiaztion List
  app.get(
    `/tenant/:tenantId/member/:memberId/organization`,
    safeWrap(require('./memberOrganizationList').default),
  )

  // Member Organiaztion Create
  app.post(
    `/tenant/:tenantId/member/:memberId/organization`,
    safeWrap(require('./memberOrganizationCreate').default),
  )

  // Member Organiaztion Update
  app.patch(
    `/tenant/:tenantId/member/:memberId/organization/:id`,
    safeWrap(require('./memberOrganizationUpdate').default),
  )

  // Member Organiaztion Delete
  app.delete(
    `/tenant/:tenantId/member/:memberId/organization/:id`,
    safeWrap(require('./memberOrganizationDelete').default),
  )
}
