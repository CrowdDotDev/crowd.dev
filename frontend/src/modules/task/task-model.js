import IdField from '@/shared/fields/id-field'
import StringField from '@/shared/fields/string-field'
import DateTimeField from '@/shared/fields/date-time-field'
import { GenericModel } from '@/shared/model/generic-model'
import StringArrayField from '@/shared/fields/string-array-field'

const fields = {
  id: new IdField('id', 'ID'),
  title: new StringField('title', 'Title', {
    required: true
  }),
  description: new StringField(
    'description',
    'Description'
  ),
  dueDate: new DateTimeField('dueDate', 'Due date'),
  assignees: new StringArrayField(
    'assignees',
    'Assignee(s)',
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
