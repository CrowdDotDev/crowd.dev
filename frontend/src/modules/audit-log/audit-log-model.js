import { i18n } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import DateTimeRangeField from '@/shared/fields/date-time-range-field'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import JsonField from '@/shared/fields/json-field'
import { GenericModel } from '@/shared/model/generic-model'
import StringArrayField from '@/shared/fields/string-array-field'

function label(name) {
  return i18n(`auditLog.fields.${name}`)
}

const fields = {
  id: new IdField('id', label('id')),
  timestampRange: new DateTimeRangeField(
    'timestampRange',
    label('timestampRange')
  ),
  timestamp: new DateTimeField(
    'timestamp',
    label('timestamp')
  ),
  createdByEmail: new StringField(
    'createdByEmail',
    label('createdByEmail')
  ),
  entityName: new StringField(
    'entityName',
    label('entityName')
  ),
  entityNames: new StringArrayField(
    'entityNames',
    label('entityNames')
  ),
  action: new StringField('action', label('action')),
  entityId: new StringField('entityId', label('entityId')),
  values: new JsonField('values', label('values'))
}

export class AuditLogModel extends GenericModel {
  static get fields() {
    return fields
  }
}
