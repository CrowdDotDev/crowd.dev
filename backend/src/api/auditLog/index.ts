import { safeWrap } from '../../middlewares/error.middleware'

export default (app) => {
  app.get(`/audit-log`, safeWrap(require('./auditLogList').default))

  app.post(`/audit-logs/query`, safeWrap(require('./auditLogsQuery').default))
}
