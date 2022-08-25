import { AuditLogModel } from '@/modules/audit-log/audit-log-model'

const { fields } = AuditLogModel

export default [
  fields.timestamp,
  fields.createdByEmail,
  fields.entityName,
  fields.action,
  fields.entityId,
  fields.values,
  fields.id
]
