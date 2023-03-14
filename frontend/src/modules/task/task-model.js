import IdField from '@/shared/fields/id-field'
import StringField from '@/shared/fields/string-field'
import DateTimeField from '@/shared/fields/date-time-field'
import { GenericModel } from '@/shared/model/generic-model'
import RelationToManyField from '@/shared/fields/relation-to-many-field'
import Permissions from '@/security/permissions'
import { UserService } from '@/modules/user/user-service'
import { MemberService } from '@/modules/member/member-service'

const fetchUsers = (query, limit) => {
  return UserService.fetchUserAutocomplete(query, limit)
}

const fields = {
  id: new IdField('id', 'ID'),
  title: new StringField('name', 'Title', {
    required: true
  }),
  description: new StringField('body', 'Description'),
  dueDate: new DateTimeField('dueDate', 'Due date'),
  relatedMembers: new RelationToManyField(
    'members',
    'Related member(s)',
    '/member',
    Permissions.values.memberRead,
    MemberService.listAutocomplete,
    (record) => record,
    {}
  ),
  assignees: new RelationToManyField(
    'assignees',
    'Assignee(s)',
    '/user',
    Permissions.values.userRead,
    fetchUsers,
    () => {}
  )
}

export class TaskModel extends GenericModel {
  static get fields() {
    return fields
  }
}
