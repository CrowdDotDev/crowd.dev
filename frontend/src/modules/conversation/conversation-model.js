import { i18n } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import { ActivityField } from '../activity/activity-field'
import BooleanField from '@/shared/fields/boolean-field'

function label(name) {
  return i18n(`entities.conversation.fields.${name}`)
}

const fields = {
  id: new IdField('id', label('id')),
  title: new StringField('title', label('title'), {
    required: true
  }),
  published: new BooleanField(
    'published',
    label('published'),
    {
      required: true
    }
  ),
  platform: new StringField('platform', label('platform')),
  channel: new StringField('channel', label('channel')),
  activities: ActivityField.relationToMany(
    'activities',
    label('activities'),
    {}
  ),
  createdAt: new DateTimeField(
    'createdAt',
    label('createdAt')
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt')
  )
}

export class ConversationModel extends GenericModel {
  static get fields() {
    return fields
  }
}
