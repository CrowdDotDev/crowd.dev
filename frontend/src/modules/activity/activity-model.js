import { i18n, init as i18nInit } from '@/i18n';
import { GenericModel } from '@/shared/model/generic-model';
import { MemberField } from '@/modules/member/member-field';
import SearchField from '@/shared/fields/search-field';
import SentimentField from '@/shared/fields/sentiment-field';
import ActivityDateField from '@/shared/fields/activity-date-field';
import ActivityChannelsField from '@/shared/fields/activity-channels-field';
import ActivityPlatformField from './activity-platform-field';
import ActivityTypeField from './activity-type-field';

function label(name) {
  return i18n(`entities.activity.fields.${name}`);
}

i18nInit();

const fields = {
  search: new SearchField('search', label('search'), {
    fields: ['title', 'body'],
  }),
  member: MemberField.relationToOne(
    'memberId',
    label('member'),
    {
      required: true,
      filterable: true,
    },
  ),
  date: new ActivityDateField('timestamp', label('date'), {
    filterable: true,
  }),
  platform: new ActivityPlatformField(
    'platform',
    label('platform'),
    {
      required: true,
      min: 2,
      filterable: true,
    },
  ),
  type: new ActivityTypeField('type', label('type'), {
    required: true,
    filterable: true,
  }),
  sentiment: new SentimentField('sentiment', 'Sentiment', {
    filterable: true,
  }),
  activityChannels: new ActivityChannelsField(
    'channel',
    'Channel',
    {
      filterable: true,
    },
  ),
};

export class ActivityModel extends GenericModel {
  static get fields() {
    return fields;
  }
}
