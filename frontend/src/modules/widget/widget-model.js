import { i18n } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeField from '@/shared/fields/date-time-field'
import JsonField from '@/shared/fields/json-field'
import StringField from '@/shared/fields/string-field'

function label(name) {
  return i18n(`entities.widget.fields.${name}`)
}

const fields = {
  id: new IdField('id', label('id')),
  type: new StringField('type', label('type')),
  settings: new JsonField('settings', label('settings')),
  createdAt: new DateTimeField(
    'createdAt',
    label('createdAt')
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt')
  )
}

export class WidgetModel extends GenericModel {
  static get fields() {
    return fields
  }
}
