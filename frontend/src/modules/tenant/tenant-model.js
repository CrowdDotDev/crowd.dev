import StringField from '@/shared/fields/string-field';
import { GenericModel } from '@/shared/model/generic-model';
import StringArrayField from '@/shared/fields/string-array-field';

const fields = {
  id: new StringField('id', 'Id'),
  tenantUrl: new StringField('url', 'Community URL', {
    required: true,
    max: 50,
  }),
  tenantName: new StringField('name', 'Community name', {
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
    'Community platforms',
    {
      required: true,
    },
  ),
  tenantSize: new StringField(
    'communitySize',
    'Community size',
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
