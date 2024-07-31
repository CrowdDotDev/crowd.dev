import { safeWrap } from '@/middlewares/errorMiddleware'

export default (app) => {
  // Member Identity List
  app.get(
    `/tenant/:tenantId/member/:memberId/identity`,
    safeWrap(require('./memberIdentityList').default),
  )

  // Member Identity Create
  app.post(
    `/tenant/:tenantId/member/:memberId/identity`,
    safeWrap(require('./memberIdentityCreate').default),
  )

  // Member Identity Create Multiple
  app.put(
    `/tenant/:tenantId/member/:memberId/identity`,
    safeWrap(require('./memberIdentityCreateMultiple').default),
  )

  // Member Identity Update
  app.patch(
    `/tenant/:tenantId/member/:memberId/identity/:id`,
    safeWrap(require('./memberIdentityUpdate').default),
  )

  // Member Identity Delete
  app.delete(
    `/tenant/:tenantId/member/:memberId/identity/:id`,
    safeWrap(require('./memberIdentityDelete').default),
  )
}
