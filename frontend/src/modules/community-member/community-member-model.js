import { i18n } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeRangeField from '@/shared/fields/date-time-range-field'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import JsonField from '@/shared/fields/json-field'
import { ActivityField } from '@/modules/activity/activity-field'
import { CommunityMemberField } from '@/modules/community-member/community-member-field'
import { TagField } from '@/modules/tag/tag-field'
import IntegerRangeField from '@/shared/fields/integer-range-field'
import IntegerField from '@/shared/fields/integer-field'
import CommunityMemberEngagementLevelField from './community-member-engagement-level-field'

function label(name) {
  return i18n(`entities.communityMember.fields.${name}`)
}

const fields = {
  id: new IdField('id', label('id')),
  username: new JsonField('username', label('username'), {
    required: true,
    customFilterPreview: (record) => {
      return record
    }
  }),
  // This is only used to filter members
  platform: new StringField('platform', label('platform')),
  activities: ActivityField.relationToMany(
    'activities',
    label('activities'),
    {}
  ),
  info: new JsonField('info', label('info')),
  followers: CommunityMemberField.relationToMany(
    'followers',
    label('followers'),
    {}
  ),
  following: CommunityMemberField.relationToMany(
    'following',
    label('following'),
    {}
  ),
  tags: TagField.relationToMany('tags', label('tags'), {}),
  crowdInfo: new StringField(
    'crowdInfo',
    label('crowdInfo'),
    {}
  ),
  email: new StringField('email', label('email'), {}),
  noMerge: CommunityMemberField.relationToMany(
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
  organisation: new StringField(
    'organisation',
    label('organisation'),
    {}
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
  activitiesCountRange: new IntegerRangeField(
    'activitiesCountRange',
    '# of Activities Range'
  ),
  scoreRange: new CommunityMemberEngagementLevelField(
    'scoreRange',
    'Engagement Level'
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

export class CommunityMemberModel extends GenericModel {
  static get fields() {
    return fields
  }
}
