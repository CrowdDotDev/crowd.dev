import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeRangeField from '@/shared/fields/date-time-range-field'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import JsonField from '@/shared/fields/json-field'
import { ActivityField } from '@/modules/activity/activity-field'
import { MemberField } from '@/modules/member/member-field'
import { TagField } from '@/modules/tag/tag-field'
import { OrganizationField } from '@/modules/organization/organization-field'
import IntegerRangeField from '@/shared/fields/integer-range-field'
import IntegerField from '@/shared/fields/integer-field'
import MemberEngagementLevelField from './member-engagement-level-field'

function label(name) {
  return i18n(`entities.member.fields.${name}`)
}

const fields = {
  id: new IdField('id', label('id')),
  username: new JsonField('username', label('username'), {
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
    label('displayName')
  ),
  // This is only used to filter members
  platform: new StringField('platform', label('platform')),
  activities: ActivityField.relationToMany(
    'activities',
    label('activities'),
    {}
  ),
  info: new JsonField('info', label('info')),
  tags: TagField.relationToMany('tags', label('tags'), {
    filterable: true
  }),
  email: new StringField('email', label('email'), {}),
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
  organization: OrganizationField.relationToMany(
    'organizations',
    label('organizations'),
    {
      filterable: true
    }
  ),
  joinedAt: new DateTimeField(
    'joinedAt',
    label('joinedAt'),
    {
      required: true
    }
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
  reachRange: new IntegerRangeField(
    'reachRange',
    'Reach Range'
  ),
  createdAtRange: new DateTimeRangeField(
    'createdAtRange',
    label('createdAtRange')
  )
}

export class MemberModel extends GenericModel {
  static get fields() {
    i18nInit()
    return fields
  }
}
