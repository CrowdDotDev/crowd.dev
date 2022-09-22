import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import DateTimeRangeField from '@/shared/fields/date-time-range-field'
import DateTimeField from '@/shared/fields/date-time-field'
import StringField from '@/shared/fields/string-field'
import { CommunityMemberField } from '@/modules/community-member/community-member-field'

function label(name) {
  return i18n(`entities.tag.fields.${name}`)
}

i18nInit()

const fields = {
  id: new IdField('id', label('id')),
  communityMember: CommunityMemberField.relationToMany(
    'communityMember',
    label('communityMember'),
    {}
  ),
  name: new StringField('name', label('name'), {}),
  createdAt: new DateTimeField(
    'createdAt',
    label('createdAt')
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt')
  ),
  createdAtRange: new DateTimeRangeField(
    'createdAtRange',
    label('createdAtRange')
  )
}

export class TagModel extends GenericModel {
  static get fields() {
    return fields
  }
}
