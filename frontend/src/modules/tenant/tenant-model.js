import { i18n, init as i18nInit } from '@/i18n';
import StringField from '@/shared/fields/string-field';
import { GenericModel } from '@/shared/model/generic-model';
import StringArrayField from '@/shared/fields/string-array-field';

function label(name) {
  return i18n(`tenant.fields.${name}`);
}

i18nInit();

const fields = {
  id: new StringField('id', label('id')),
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
    'What would you like to achieve with LFX? ',
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
};

export class TenantModel extends GenericModel {
  static get fields() {
    return fields;
  }
}
