import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import BooleanField from '@/shared/fields/boolean-field'

function label(name) {
  return i18n(`entities.automation.fields.${name}`)
}

i18nInit()

const fields = {
  id: new IdField('id', label('id')),
  name: new StringField('name', label('name'), {
    required: true
  }),
  active: new BooleanField('active', label('active'), {
    required: true
  }),
  createdAt: new DateTimeField(
    'createdAt',
    label('createdAt')
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt')
  )
}

export class AutomationModel extends GenericModel {
  static get fields() {
    return fields
  }
}
