import { i18n, init as i18nInit } from '@/i18n';
import StringField from '@/shared/fields/string-field';
import BooleanField from '@/shared/fields/boolean-field';
import { GenericModel } from '@/shared/model/generic-model';

i18nInit();

function label(name) {
  return i18n(`user.fields.${name}`);
}

const fields = {
  firstName: new StringField(
    'firstName',
    label('firstName'),
    {
      max: 80,
      required: true,
    },
  ),
  lastName: new StringField('lastName', label('lastName'), {
    max: 175,
    required: true,
  }),
  oldPassword: new StringField(
    'oldPassword',
    label('oldPassword'),
    {
      required: true,
    },
  ),
  newPassword: new StringField(
    'newPassword',
    label('newPassword'),
    {
      required: true,
    },
  ),
  newPasswordConfirmation: new StringField(
    'newPasswordConfirmation',
    label('newPasswordConfirmation'),
    {
      required: true,
    },
  ),
  email: new StringField('email', label('email'), {
    required: true,
    email: true,
    max: 255,
  }),
  acceptedTermsAndPrivacy: new BooleanField(
    'acceptedTermsAndPrivacy',
    label('acceptedTermsAndPrivacy'),
    {
      required: true,
    },
  ),
};

export class UserModel extends GenericModel {
  static get fields() {
    return fields;
  }
}
