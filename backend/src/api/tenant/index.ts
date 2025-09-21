import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post('/tenant/invitation-link', safeWrap(require('./tenantInvitationLink').default))
  app.post('/tenant/invitation/:invitationToken/validate', safeWrap(require('./tenantInvitationValidate').default))
}