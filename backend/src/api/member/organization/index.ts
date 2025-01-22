import { safeWrap } from '@/middlewares/errorMiddleware'

export default (app) => {
  // Member Organiaztion List
  app.get(`/member/:memberId/organization`, safeWrap(require('./memberOrganizationList').default))

  // Member Organiaztion Create
  app.post(
    `/member/:memberId/organization`,
    safeWrap(require('./memberOrganizationCreate').default),
  )

  // Member Organiaztion Update
  app.patch(
    `/member/:memberId/organization/:id`,
    safeWrap(require('./memberOrganizationUpdate').default),
  )

  // Member Organiaztion Delete
  app.delete(
    `/member/:memberId/organization/:id`,
    safeWrap(require('./memberOrganizationDelete').default),
  )
}
