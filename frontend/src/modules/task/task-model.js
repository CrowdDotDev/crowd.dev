import StringField from '@/shared/fields/string-field';
import DateTimeField from '@/shared/fields/date-time-field';
import { GenericModel } from '@/shared/model/generic-model';
import RelationToManyField from '@/shared/fields/relation-to-many-field';
import Permissions from '@/security/permissions';
import { UserService } from '@/modules/user/user-service';
import { MemberService } from '@/modules/member/member-service';

const fetchUsers = (query, limit) => UserService.fetchUserAutocomplete(query, limit);

const fetchMembers = (query, limit) => {
  let filter = {};

  if (Array.isArray(query)) {
    filter = {
      or: [
        {
          displayName: {
            in: query.map((v) => v.displayName),
          },
        },
        { emails: { contains: [query] } },
      ],
    };
  } else if (query) {
    filter = {
      or: [
        { displayName: { textContains: query } },
        { emails: { contains: [query] } },
      ],
    };
  }

  return MemberService.list(
    filter,
    '',
    limit,
    0,
    false,
  ).then(({ rows }) => rows.map((r) => ({
    ...r,
    id: r.id,
    label: r.displayName,
  })));
};

const fields = {
  title: new StringField('name', 'Title', {
    required: true,
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
        return null;
      }
      return {
        ...record,
        id: record.id,
        label: record.displayName || record.email,
        displayName: record.displayName,
        avatar: record.avatar,
      };
    },
    {},
  ),
  assignees: new RelationToManyField(
    'assignees',
    'Assignee(s)',
    '/user',
    Permissions.values.userRead,
    fetchUsers,
    () => {},
  ),
};

export class TaskModel extends GenericModel {
  static get fields() {
    return fields;
  }
}
