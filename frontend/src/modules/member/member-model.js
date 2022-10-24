import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import JsonField from '@/shared/fields/json-field'
import { ActivityField } from '@/modules/activity/activity-field'
import { MemberField } from '@/modules/member/member-field'
import { TagField } from '@/modules/tag/tag-field'
import IntegerField from '@/shared/fields/integer-field'
import MemberEngagementLevelField from './member-engagement-level-field'
import SearchField from '@/shared/fields/search-field'
import MemberIdentitiesField from './member-identities-field'

function label(name) {
  return i18n(`entities.member.fields.${name}`)
}

const fields = {
  id: new IdField('id', label('id')),
  jobTitle: new StringField('jobTitle', label('jobTitle')),
  username: new JsonField('username', label('username'), {
    nonEmpty: true,
    required: true,
    customFilterPreview: (record) => {
      return record
    }
  }),
  attributes: new JsonField(
    'attributes',
    label('attributes')
  ),
  displayName: new StringField(
    'displayName',
    label('fullName')
  ),
  identities: new MemberIdentitiesField(
    'identities',
    label('identities'),
    {
      filterable: true
    }
  ),
  // This is only used to filter members
  platform: new StringField('platform', label('platform'), {
    required: true
  }),
  activities: ActivityField.relationToMany(
    'activities',
    label('activities'),
    {}
  ),
  reach: new IntegerField('reach', label('reach'), {
    required: false,
    filterable: true
  }),
  info: new JsonField('info', label('info')),
  tags: TagField.relationToMany('tags', label('tags'), {
    filterable: true
  }),
  email: new StringField('email', label('email'), {
    email: true
  }),
  noMerge: MemberField.relationToMany(
    'noMerge',
    label('noMerge'),
    {}
  ),
  bio: new StringField('bio', label('bio')),
  location: new StringField(
    'location',
    label('location'),
    {}
  ),
  organizations: new StringField(
    'organizations',
    label('organization')
  ),
  joinedAt: new DateTimeField(
    'joinedAt',
    label('joinedAt')
  ),
  createdAt: new DateTimeField(
    'createdAt',
    label('createdAt')
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt')
  ),
  score: new IntegerField('score', label('score')),
  activityCount: new IntegerField(
    'activityCount',
    label('activityCount'),
    { filterable: true }
  ),
  engagementLevel: new MemberEngagementLevelField(
    'score',
    'Engagement Level',
    { filterable: true }
  ),
  // This field is just for filtering/searching
  search: new SearchField('search', label('search'), {
    fields: ['displayName', 'email']
  })
}

export class MemberModel extends GenericModel {
  static get fields() {
    i18nInit()
    return fields
  }
}
