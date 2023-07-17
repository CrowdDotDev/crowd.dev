import { i18n, init as i18nInit } from '@/i18n';
import { GenericModel } from '@/shared/model/generic-model';
import DateTimeField from '@/shared/fields/date-time-field';
import StringField from '@/shared/fields/string-field';
import JsonField from '@/shared/fields/json-field';
import { TagField } from '@/modules/tag/tag-field';
import { OrganizationField } from '@/modules/organization/organization-field';
import StringArrayField from '@/shared/fields/string-array-field';
import MemberEngagementLevelField from './member-engagement-level-field';

function label(name) {
  return i18n(`entities.member.fields.${name}`);
}

i18nInit();

const fields = {
  tags: TagField.relationToMany('tags', label('tags'), {
    filterable: true,
  }),
  jobTitle: new StringField('jobTitle', label('jobTitle')),
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
  name: new StringField(
    'name',
    'Name',
  ),
  displayName: new StringField(
    'displayName',
    'Full name',
  ),
  info: new JsonField('info', label('info')),
  emails: new StringArrayField('emails', 'Emails'),
  organizations: OrganizationField.relationToMany(
    'organizations',
    'Organizations',
  ),
  joinedAt: new DateTimeField('joinedAt', 'Joined date'),
  bio: new StringField('bio', label('bio')),
  location: new StringField(
    'location',
    'Location',
    {},
  ),
  engagementLevel: new MemberEngagementLevelField(
    'score',
    'Engagement level',
  ),
};

export class MemberModel extends GenericModel {
  static get fields() {
    return fields;
  }
}
