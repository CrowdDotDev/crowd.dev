import { i18n, init as i18nInit } from '@/i18n';
import { GenericModel } from '@/shared/model/generic-model';
import StringField from '@/shared/fields/string-field';
import BooleanField from '@/shared/fields/boolean-field';
import JsonField from '@/shared/fields/json-field';
import { WidgetField } from '../widget/widget-field';

function label(name) {
  return i18n(`entities.report.fields.${name}`);
}

i18nInit();

const fields = {
  name: new StringField('name', label('name'), {
    required: true,
  }),
  public: new BooleanField('public', label('public'), {
    required: true,
  }),
  widgets: WidgetField.relationToMany(
    'widgets',
    label('widgets'),
    {},
  ),
  settings: new JsonField('settings', label('settings')),
};

export class ReportModel extends GenericModel {
  static get fields() {
    return fields;
  }
}
