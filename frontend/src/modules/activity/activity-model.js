import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeRangeField from '@/shared/fields/date-time-range-field'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import BooleanField from '@/shared/fields/boolean-field'
import { MemberField } from '@/modules/member/member-field'
import JsonField from '@/shared/fields/json-field'

function label(name) {
  return i18n(`entities.activity.fields.${name}`)
}

i18nInit()

const fields = {
  id: new IdField('id', label('id')),
  type: new StringField('type', label('type'), {
    required: true
  }),
  title: new StringField('title', label('title')),
  body: new StringField('body', label('body')),
  channel: new StringField('channel', label('channel')),
  url: new StringField('url', label('url')),
  timestamp: new DateTimeField(
    'timestamp',
    label('timestamp'),
    {
      required: true
    }
  ),
  platform: new StringField('platform', label('platform'), {
    required: true,
    min: 2
  }),
  attributes: new JsonField(
    'attributes',
    label('attributes')
  ),
  member: MemberField.relationToOne(
    'member',
    label('member'),
    {
      required: true
    }
  ),
  isKeyAction: new BooleanField(
    'isKeyAction',
    label('isKeyAction'),
    {}
  ),
  createdAt: new DateTimeField(
    'createdAt',
    label('createdAt')
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt')
  ),
  createdAtRange: new DateTimeRangeField(
    'createdAtRange',
    label('createdAtRange')
  ),
  timestampRange: new DateTimeRangeField(
    'timestampRange',
    label('timestampRange')
  )
}

export class ActivityModel extends GenericModel {
  static get fields() {
    return fields
  }
}
