import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.get(`/audit-log`, safeWrap(require('./auditLogList').default))

  app.post(`/audit-logs/query`, safeWrap(require('./auditLogsQuery').default))
}
