import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeRangeField from '@/shared/fields/date-time-range-field'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import BooleanField from '@/shared/fields/boolean-field'
import { MemberField } from '@/modules/member/member-field'
import JsonField from '@/shared/fields/json-field'
import SearchField from '@/shared/fields/search-field'
import SentimentField from '@/shared/fields/sentiment-field'
import ActivityPlatformField from './activity-platform-field'
import ActivityDateField from '@/shared/fields/activity-date-field'
import ActivityTypeField from './activity-type-field'

function label(name) {
  return i18n(`entities.activity.fields.${name}`)
}

i18nInit()

const fields = {
  id: new IdField('id', label('id')),
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
  attributes: new JsonField(
    'attributes',
    label('attributes')
  ),
  isKeyAction: new BooleanField(
    'isKeyAction',
    label('isKeyAction'),
    {}
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
  ),
  search: new SearchField('search', label('search'), {
    fields: ['title', 'body']
  }),
  member: MemberField.relationToOne(
    'memberId',
    label('member'),
    {
      required: true,
      filterable: true
    }
  ),
  date: new ActivityDateField('timestamp', label('date'), {
    filterable: true
  }),
  platform: new ActivityPlatformField(
    'platform',
    label('platform'),
    {
      required: true,
      min: 2,
      filterable: true
    }
  ),
  type: new ActivityTypeField('type', label('type'), {
    required: true,
    filterable: true
  }),
  sentiment: new SentimentField('sentiment', 'Sentiment', {
    filterable: true
  })
}

export class ActivityModel extends GenericModel {
  static get fields() {
    return fields
  }
}
