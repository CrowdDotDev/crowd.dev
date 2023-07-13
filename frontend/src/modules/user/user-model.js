import Roles from '@/security/roles';
import { i18n, init as i18nInit } from '@/i18n';
import IdField from '@/shared/fields/id-field';
import StringField from '@/shared/fields/string-field';
import BooleanField from '@/shared/fields/boolean-field';
import ImagesField from '@/shared/fields/images-field';
import DateTimeField from '@/shared/fields/date-time-field';
import DateTimeRangeField from '@/shared/fields/date-time-range-field';
import GenericField from '@/shared/fields/generic-field';
import EnumeratorField from '@/shared/fields/enumerator-field';
import { GenericModel } from '@/shared/model/generic-model';
import Storage from '@/security/storage';
import { EmailsField } from '@/shared/form/fields/email-field';
import { RolesField } from '@/shared/form/fields/roles-field';

i18nInit();

function label(name) {
  return i18n(`user.fields.${name}`);
}

const fields = {
  id: new IdField('id', label('id')),
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
  password: new StringField('password', label('password'), {
    required: true,
  }),
  passwordConfirmation: new StringField(
    'passwordConfirmation',
    label('passwordConfirmation'),
    {
      required: true,
    },
  ),
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
  fullName: new StringField('fullName', label('fullName')),
  email: new StringField('email', label('email'), {
    required: true,
    email: true,
    max: 255,
  }),
  role: new EnumeratorField(
    'role',
    label('role'),
    Roles.selectOptions,
  ),
  rememberMe: new BooleanField(
    'rememberMe',
    label('rememberMe'),
  ),
  phoneNumber: new StringField(
    'phoneNumber',
    label('phoneNumber'),
    {
      matches: /^[0-9]/,
      max: 24,
    },
  ),
  avatars: new ImagesField(
    'avatars',
    label('avatars'),
    Storage.values.userAvatarsProfiles,
    { max: 1 },
  ),
  emails: new EmailsField('emails', label('emails'), {
    required: true,
  }),
  rolesRequired: new RolesField('roles', label('roles'), {
    required: true,
  }),
  roles: new RolesField('roles', label('roles')),
  status: new EnumeratorField('status', label('status'), [
    {
      id: 'active',
      label: i18n('user.status.active'),
    },
    {
      id: 'invited',
      label: i18n('user.status.invited'),
    },
    {
      id: 'empty-permissions',
      label: i18n('user.status.empty-permissions'),
    },
  ]),
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
  acceptedTermsAndPrivacy: new BooleanField(
    'acceptedTermsAndPrivacy',
    label('acceptedTermsAndPrivacy'),
    {
      required: true,
    },
  ),
  roleUser: new GenericField('roleUser', label('roleUser')),
};

export class UserModel extends GenericModel {
  static get fields() {
    return fields;
  }
}
