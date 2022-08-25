export default (app) => {
  app.get(`/tenant/:tenantId/audit-log`, require('./auditLogList').default)
}
