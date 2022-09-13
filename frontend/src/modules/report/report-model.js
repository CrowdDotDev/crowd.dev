import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import { WidgetField } from '../widget/widget-field'
import BooleanField from '@/shared/fields/boolean-field'
import JsonField from '@/shared/fields/json-field'

function label(name) {
  return i18n(`entities.report.fields.${name}`)
}

i18nInit()

const fields = {
  id: new IdField('id', label('id')),
  name: new StringField('name', label('name'), {
    required: true
  }),
  public: new BooleanField('public', label('public'), {
    required: true
  }),
  widgets: WidgetField.relationToMany(
    'widgets',
    label('widgets'),
    {}
  ),
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

export class ReportModel extends GenericModel {
  static get fields() {
    return fields
  }
}
