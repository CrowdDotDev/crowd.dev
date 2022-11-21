import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import OrganizationMemberCountField from '@/modules/organization/organization-member-count-field'
import OrganizationEmployeesField from '@/modules/organization/organization-employees-field'

function label(name) {
  return i18n(`entities.member.fields.${name}`)
}

i18nInit()

const fields = {
  id: new IdField('id', label('id')),
  name: new StringField('name', label('name')),
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
  )
}

export class OrganizationModel extends GenericModel {
  static get fields() {
    return fields
  }
}
