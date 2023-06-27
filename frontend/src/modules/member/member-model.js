import { i18n, init as i18nInit } from '@/i18n';
import IdField from '@/shared/fields/id-field';
import { GenericModel } from '@/shared/model/generic-model';
import DateTimeField from '@/shared/fields/date-time-field';
import StringField from '@/shared/fields/string-field';
import JsonField from '@/shared/fields/json-field';
import { ActivityField } from '@/modules/activity/activity-field';
import { MemberField } from '@/modules/member/member-field';
import { TagField } from '@/modules/tag/tag-field';
import { OrganizationField } from '@/modules/organization/organization-field';
import IntegerField from '@/shared/fields/integer-field';
import SearchField from '@/shared/fields/search-field';
import SentimentField from '@/shared/fields/sentiment-field';
import ActivityTypeField from '@/modules/activity/activity-type-field';
import StringArrayField from '@/shared/fields/string-array-field';
import BooleanField from '@/shared/fields/boolean-field';
import GenericField from '@/shared/fields/generic-field';
import MemberIdentitiesField from './member-identities-field';
import MemberEngagementLevelField from './member-engagement-level-field';

function label(name) {
  return i18n(`entities.member.fields.${name}`);
}

i18nInit();

const fields = {
  id: new IdField('id', label('id')),
  jobTitle: new StringField('jobTitle', 'Job title'),
  username: new JsonField('username', label('username'), {
    nonEmpty: true,
    nonEmptyValues: true,
    requiredUnless: 'email',
    customFilterPreview: (record) => record,
  }),
  attributes: new JsonField(
    'attributes',
    label('attributes'),
  ),
  displayName: new StringField(
    'displayName',
    'Full name',
  ),
  identities: new MemberIdentitiesField(
    'identities',
    label('identities'),
    {
      filterable: true,
    },
  ),
  activeOn: new MemberIdentitiesField(
    'activeOn',
    label('activeOn'),
    {
      filterable: true,
    },
  ),
  activities: ActivityField.relationToMany(
    'activities',
    label('activities'),
    {},
  ),
  reach: new IntegerField('reach', label('reach'), {
    required: false,
    filterable: true,
  }),
  info: new JsonField('info', label('info')),
  tags: TagField.relationToMany('tags', 'Tags', {
    filterable: true,
  }),
  emails: new StringArrayField('emails', 'Emails'),
  noMerge: MemberField.relationToMany(
    'noMerge',
    label('noMerge'),
    {},
  ),
  bio: new StringField('bio', 'Bio'),
  location: new StringField(
    'location',
    'Location',
    {},
  ),
  organizations: OrganizationField.relationToMany(
    'organizations',
    'Organizations',
  ),
  joinedAt: new DateTimeField('joinedAt', 'Joined date', {
    filterable: true,
  }),
  lastActive: new DateTimeField(
    'lastActive',
    'Last activity date',
    {
      filterable: true,
    },
  ),
  createdAt: new DateTimeField(
    'createdAt',
    label('createdAt'),
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt'),
  ),
  score: new IntegerField('score', label('score')),
  averageSentiment: new SentimentField(
    'averageSentiment',
    'Avg. sentiment',
    {
      filterable: true,
    },
  ),
  activityCount: new IntegerField(
    'activityCount',
    label('activityCount'),
    { filterable: true },
  ),
  numberOfOpenSourceContributions: new IntegerField(
    'numberOfOpenSourceContributions',
    label('numberOfOpenSourceContributions'),
    { filterable: true },
  ),
  activityTypes: new ActivityTypeField(
    'activityTypes',
    label('activityTypes'),
    {
      required: true,
      filterable: true,
    },
  ),
  engagementLevel: new MemberEngagementLevelField(
    'score',
    'Engagement level',
    { filterable: true },
  ),
  // This field is just for filtering/searching
  search: new SearchField('search', label('search'), {
    fields: ['displayName', 'emails'],
  }),
  lastEnriched: new BooleanField('lastEnriched', 'Enriched member', {
    filterable: true,
  }),
  affiliations: new GenericField('affiliations', 'Affiliations'),
};

export class MemberModel extends GenericModel {
  static get fields() {
    return fields;
  }
}
