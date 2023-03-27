import { i18n, init as i18nInit } from '@/i18n';
import DateTimeField from '@/shared/fields/date-time-field';
import DateTimeRangeField from '@/shared/fields/date-time-range-field';
import IdField from '@/shared/fields/id-field';
import StringField from '@/shared/fields/string-field';
import { GenericModel } from '@/shared/model/generic-model';
import StringArrayField from '@/shared/fields/string-array-field';

function label(name) {
  return i18n(`tenant.fields.${name}`);
}

i18nInit();

const fields = {
  id: new IdField('id', label('id')),
  name: new StringField('name', label('name'), {
    required: true,
    max: 50,
  }),
  url: new StringField('url', label('url'), {
    required: true,
    max: 50,
  }),
  tenantUrl: new StringField('url', label('tenantUrl'), {
    required: true,
    max: 50,
  }),
  tenantName: new StringField('name', label('tenantName'), {
    required: true,
    max: 50,
  }),
  reasonForUsingCrowd: new StringField(
    'reasonForUsingCrowd',
    'What would you like to achieve with crowd.dev? ',
    {},
  ),
  tenantPlatforms: new StringArrayField(
    'integrationsRequired',
    label('tenantPlatforms'),
    {
      required: true,
    },
  ),
  tenantSize: new StringField(
    'communitySize',
    label('tenantSize'),
    {
      required: true,
    },
  ),
  plan: new StringField('plan', label('plan')),
  tenantId: new IdField('id', label('tenantId')),
  createdAt: new DateTimeField(
    'createdAt',
    label('createdAt'),
  ),
  updatedAt: new DateTimeField(
    'updatedAt',
    label('updatedAt'),
  ),
  createdAtRange: new DateTimeRangeField(
    'createdAtRange',
    label('createdAtRange'),
  ),
};

export class TenantModel extends GenericModel {
  static get fields() {
    return fields;
  }
}
