import { safeWrap } from '@/middlewares/errorMiddleware'
import { memberIdOrLfidMiddleware } from '@/middlewares/memberIdOrLfidMiddleware'

export default (app) => {
  // Member Organiaztion List
  app.get(
    `/member/:memberIdOrLfid/organization`,
    memberIdOrLfidMiddleware,
    safeWrap(require('./memberOrganizationList').default),
  )

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

  app.get(
    `/member/:memberIdOrLfid/organization/status`,
    memberIdOrLfidMiddleware,
    safeWrap(require('./memberOrganizationStatus').default),
  )

  app.post(
    `/member/:memberIdOrLfid/organization/user-validation`,
    memberIdOrLfidMiddleware,
    safeWrap(require('./memberOrganizationUserValidation').default),
  )
}
