import { i18n, init as i18nInit } from '@/i18n'
import { GenericModel } from '@/shared/model/generic-model'
import StringField from '@/shared/fields/string-field'
import BooleanField from '@/shared/fields/boolean-field'

function label(name) {
  return i18n(`entities.emailDigest.fields.${name}`)
}

i18nInit()

const fields = {
  email: new StringField('email', label('email'), {
    required: true
  }),
  frequency: new StringField(
    'frequency',
    label('frequency'),
    {
      required: true
    }
  ),
  time: new StringField('time', label('time'), {
    required: true
  }),
  updateResults: new BooleanField(
    'updateResults',
    label('updateResults')
  )
}

export class EagleEyeEmailDigestModel extends GenericModel {
  static get fields() {
    return fields
  }
}
