import { safeWrap } from '@/middlewares/errorMiddleware'
import { memberIdOrLfidMiddleware } from '@/middlewares/memberIdOrLfidMiddleware'

export default (app) => {
  // Member Identity List
  app.get(`/member/:memberId/identity`, safeWrap(require('./memberIdentityList').default))

  // Member Identity Create
  app.post(`/member/:memberId/identity`, safeWrap(require('./memberIdentityCreate').default))

  // Member Identity Create Multiple
  app.put(`/member/:memberId/identity`, safeWrap(require('./memberIdentityCreateMultiple').default))

  // Member Identity Update
  app.patch(`/member/:memberId/identity/:id`, safeWrap(require('./memberIdentityUpdate').default))

  // Member Identity Delete
  app.delete(`/member/:memberId/identity/:id`, safeWrap(require('./memberIdentityDelete').default))

  app.get(`/member/:memberIdOrLfid/detected-identity`, memberIdOrLfidMiddleware, safeWrap(require('./memberIdentityDetectedList').default))

  app.post(`/member/:memberIdOrLfid/user-validation`, memberIdOrLfidMiddleware, safeWrap(require('./memberIdentityUserValidation').default))
}
