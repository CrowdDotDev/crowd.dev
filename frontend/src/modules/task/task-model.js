import IdField from '@/shared/fields/id-field'
import StringField from '@/shared/fields/string-field'
import DateTimeField from '@/shared/fields/date-time-field'
import { GenericModel } from '@/shared/model/generic-model'
import RelationToManyField from '@/shared/fields/relation-to-many-field'
import Permissions from '@/security/permissions'
import { UserService } from '@/premium/user/user-service'
import { MemberService } from '@/modules/member/member-service'

const fetchUser = (query, limit) => {
  return UserService.fetchUsers(
    { fullName: query },
    '',
    limit,
    0
  ).then(({ rows }) => {
    return rows.map((r) => ({
      id: r.id,
      label: r.fullName,
    }))
  })
}

const fetchMembers = (query, limit) => {
  return MemberService.list(
    {
      or: [
        { displayName: { textContains: query } },
        { email: { textContains: query } }
      ]
    },
    '',
    limit,
    0,
    false
  ).then(({ rows }) => {
    return rows.map((r) => ({
      ...r,
      id: r.id,
      label: r.displayName,
    }))
  })
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
    fetchMembers,
    (record) => {
      if (!record) {
        return null
      }
      return {
        ...record,
        id: record.id,
        label: record.displayName || record.email,
        displayName: record.displayName,
        avatar: record.avatar
      }
    },
    {}
  ),
  assignees: new RelationToManyField(
    'assignees',
    'Assignee(s)',
    '/user',
    Permissions.values.userRead,
    fetchUser,
    (record) => {
      if (!record) {
        return null
      }
      return {
        id: record.id,
        label: record.fullName || record.email,
        displayName: record.fullName,
        avatar: record.avatar
      }
    },
    {
      required: true
    }
  )
}

export class TaskModel extends GenericModel {
  static get fields() {
    return fields
  }
}
