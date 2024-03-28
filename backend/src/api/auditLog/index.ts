import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/tenant/:tenantId/audit-log`, safeWrap(require('./auditLogList').default))

  app.post(`/tenant/:tenantId/audit-logs/query`, safeWrap(require('./auditLogsQuery').default))
}
