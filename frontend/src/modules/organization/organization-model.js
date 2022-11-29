import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import OrganizationMemberCountField from '@/modules/organization/organization-member-count-field'
import OrganizationEmployeesField from '@/modules/organization/organization-employees-field'
import SearchField from '@/shared/fields/search-field'
import ActivityDateField from '@/shared/fields/activity-date-field'
import OrganizationPlatformField from './organization-platform-field'
import JsonField from '@/shared/fields/json-field'
import StringArrayField from '@/shared/fields/string-array-field'
import IntegerField from '@/shared/fields/integer-field'

function label(name) {
  return i18n(`entities.organization.fields.${name}`)
}

i18nInit()

const fields = {
  id: new IdField('id', label('id')),
  name: new StringField('name', label('name'), {
    required: true
  }),
  description: new StringField(
    'description',
    label('description')
  ),
  url: new StringField('url', label('url')),
  website: new StringField('website', label('website')),
  location: new StringField('location', label('location')),
  createdAt: new DateTimeField(
    'createdAt',
    label('createdAt')
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt')
  ),
  members: new OrganizationMemberCountField(
    'memberCount',
    '# of members',
    { filterable: true }
  ),
  employees: new OrganizationEmployeesField(
    'employees',
    '# of employees',
    {
      filterable: true
    }
  ),
  activityCount: new IntegerField(
    'activityCount',
    '# of activities',
    {
      filterable: true
    }
  ),
  revenueRange: new JsonField(
    'revenueRange',
    label('revenueRange')
  ),
  joinedAt: new ActivityDateField(
    'joinedAt',
    'Active since',
    {
      filterable: true
    }
  ),
  activeOn: new OrganizationPlatformField(
    'activeOn',
    'Active on',
    { filterable: true }
  ),
  github: new JsonField('github', label('github')),
  twitter: new JsonField('twitter', label('twitter')),
  linkedin: new JsonField('linkedin', label('linkedin')),
  crunchbase: new JsonField(
    'crunchbase',
    label('crunchbase')
  ),
  emails: new StringArrayField('emails', 'E-mail address'),
  phoneNumbers: new StringArrayField(
    'phoneNumbers',
    'Phone number'
  ),

  // This field is just for filtering/searching
  // TODO: Confirm what else can be searchable
  search: new SearchField('search', label('search'), {
    fields: ['name']
  })
}

export class OrganizationModel extends GenericModel {
  static get fields() {
    return fields
  }
}
