import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import IntegerField from '@/shared/fields/integer-field'
import { ActivityField } from '../activity/activity-field'
import BooleanField from '@/shared/fields/boolean-field'
import DateTimeRangeField from '@/shared/fields/date-time-range-field'
import ActivityPlatformField from '@/modules/activity/activity-platform-field'
import ActivityDateField from '@/modules/activity/activity-date-field'
import SearchField from '@/shared/fields/search-field'

function label(name) {
  return i18n(`entities.conversation.fields.${name}`)
}

i18nInit()

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
  activities: ActivityField.relationToMany(
    'activities',
    label('activities'),
    {}
  ),
  createdAtRange: new DateTimeRangeField(
    'createdAtRange',
    label('createdAtRange')
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt')
  ),
  platform: new ActivityPlatformField(
    'platform',
    label('platform'),
    {
      filterable: true
    }
  ),
  search: new SearchField('search', label('search'), {
    fields: ['title']
  }),
  channel: new StringField('channel', label('channel'), {
    filterable: true
  }),
  activityCount: new IntegerField(
    'activityCount',
    label('activityCount'),
    { filterable: true }
  ),
  lastActive: new ActivityDateField(
    'lastActive',
    label('lastActive'),
    {
      filterable: true
    }
  ),
  createdAt: new ActivityDateField(
    'createdAt',
    label('createdAt'),
    {
      filterable: true
    }
  )
}

export class ConversationModel extends GenericModel {
  static get fields() {
    return fields
  }
}
