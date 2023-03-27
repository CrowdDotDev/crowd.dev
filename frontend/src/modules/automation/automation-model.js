import { i18n, init as i18nInit } from '@/i18n';
import IdField from '@/shared/fields/id-field';
import { GenericModel } from '@/shared/model/generic-model';
import DateTimeField from '@/shared/fields/date-time-field';
import StringField from '@/shared/fields/string-field';
import JsonField from '@/shared/fields/json-field';

function label(name) {
  return i18n(`entities.automation.fields.${name}`);
}

i18nInit();

const fields = {
  id: new IdField('id', label('id')),
  type: new StringField('type', label('type')),
  trigger: new StringField('trigger', label('trigger'), {
    required: true,
  }),
  status: new StringField('status', label('status'), {
    required: true,
  }),
  settings: new JsonField('settings', label('settings')),
  createdAt: new DateTimeField(
    'createdAt',
    label('createdAt'),
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt'),
  ),
};

export class AutomationModel extends GenericModel {
  static get fields() {
    return fields;
  }
}
