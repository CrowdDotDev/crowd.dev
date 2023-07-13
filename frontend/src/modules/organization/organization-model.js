import { i18n, init as i18nInit } from '@/i18n';
import { GenericModel } from '@/shared/model/generic-model';
import DateTimeField from '@/shared/fields/date-time-field';
import StringField from '@/shared/fields/string-field';
import OrganizationMemberCountField from '@/modules/organization/organization-member-count-field';
import SearchField from '@/shared/fields/search-field';
import JsonField from '@/shared/fields/json-field';
import StringArrayField from '@/shared/fields/string-array-field';
import IntegerField from '@/shared/fields/integer-field';
import BooleanField from '@/shared/fields/boolean-field';
import OrganizationHeadcountField from './organization-headcount-field';
import OrganizationEmployeesField from './organization-employees-field';
import OrganizationTypeField from './organization-type-field';
import OrganizationPlatformField from './organization-platform-field';

function label(name) {
  return i18n(`entities.organization.fields.${name}`);
}

i18nInit();

const fields = {
  id: new StringField('id', label('id')),
  name: new StringField('name', label('name'), {
    required: true,
  }),
  displayName: new StringField('displayName', label('name'), {
    required: true,
  }),
  description: new StringField(
    'description',
    label('description'),
  ),
  website: new StringField('website', label('website')),
  location: new StringField('location', label('location'), { filterable: true }),
  createdAt: new DateTimeField(
    'createdAt',
    label('createdAt'),
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt'),
  ),
  members: new OrganizationMemberCountField(
    'memberCount',
    '# of members',
    { filterable: true },
  ),
  employees: new OrganizationEmployeesField(
    'employees',
    '# of employees',
  ),
  activityCount: new IntegerField(
    'activityCount',
    '# of activities',
    {
      filterable: true,
    },
  ),
  lastActive: new DateTimeField(
    'lastActive',
    'Last activity date',
    {
      filterable: true,
    },
  ),
  revenueRange: new JsonField(
    'revenueRange',
    label('revenueRange'),
  ),
  joinedAt: new DateTimeField('joinedAt', 'Joined date', {
    filterable: true,
  }),
  activeOn: new OrganizationPlatformField(
    'activeOn',
    'Active on',
    { filterable: true },
  ),
  github: new JsonField('github', label('github')),
  twitter: new JsonField('twitter', label('twitter')),
  linkedin: new JsonField('linkedin', label('linkedin')),
  crunchbase: new JsonField(
    'crunchbase',
    label('crunchbase'),
  ),
  emails: new StringArrayField('emails', 'E-mail address'),
  phoneNumbers: new StringArrayField(
    'phoneNumbers',
    'Phone number',
  ),

  search: new SearchField('search', label('search'), {
    fields: ['name'],
  }),
  headline: new StringField('headline', 'Headline', { filterable: true }),
  size: new OrganizationHeadcountField('size', 'Headcount', { filterable: true }),
  industry: new StringField('industry', 'Industry', { filterable: true }),
  founded: new IntegerField('founded', 'Founded', { filterable: true }),
  type: new OrganizationTypeField('organizationType', 'Type', { filterable: true }),
  profiles: new StringArrayField('profiles', 'Profiles'),
  lastEnrichedAt: new BooleanField('lastEnrichedAt', 'Enriched organization', {
    filterable: true,
  }),
};

export class OrganizationModel extends GenericModel {
  static get fields() {
    return fields;
  }
}
