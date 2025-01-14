import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/tenant/audit-log`, safeWrap(require('./auditLogList').default))

  app.post(`/tenant/audit-logs/query`, safeWrap(require('./auditLogsQuery').default))
}
