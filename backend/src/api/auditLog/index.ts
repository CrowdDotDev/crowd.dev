import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/tenant/:tenantId/audit-log`, safeWrap(require('./auditLogList').default))
}
