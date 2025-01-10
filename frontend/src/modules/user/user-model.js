import StringField from '@/shared/fields/string-field';
import BooleanField from '@/shared/fields/boolean-field';
import { GenericModel } from '@/shared/model/generic-model';

const fields = {
  firstName: new StringField(
    'firstName',
    'First name',
    {
      max: 80,
      required: true,
    },
  ),
  lastName: new StringField('lastName', 'Last name', {
    max: 175,
    required: true,
  }),
  oldPassword: new StringField(
    'oldPassword',
    'Old password',
    {
      required: true,
    },
  ),
  newPassword: new StringField(
    'newPassword',
    'New password',
    {
      required: true,
    },
  ),
  newPasswordConfirmation: new StringField(
    'newPasswordConfirmation',
    'Confirm new password',
    {
      required: true,
    },
  ),
  email: new StringField('email', 'E-mail', {
    required: true,
    email: true,
    max: 255,
  }),
  acceptedTermsAndPrivacy: new BooleanField(
    'acceptedTermsAndPrivacy',
    'Terms and privacy',
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
