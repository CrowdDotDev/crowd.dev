import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import StringField from '@/shared/fields/string-field'
import EagleEyePlatformField from '@/premium/eagle-eye/eagle-eye-platform-field'
import EagleEyeDateField from '@/premium/eagle-eye/eagle-eye-date-field'

function label(name) {
  return i18n(`entities.activity.fields.${name}`)
}

i18nInit()

const fields = {
  id: new IdField('id', label('id')),
  title: new StringField('title', label('title')),
  text: new StringField('text', label('text')),
  status: new StringField('status', label('status')),
  url: new StringField('url', label('url')),
  platform: new EagleEyePlatformField(
    'platform',
    label('platform'),
    {
      filterable: true
    }
  ),
  date: new EagleEyeDateField('timestamp', label('date'), {
    filterable: true
  })
}

export class EagleEyeModel extends GenericModel {
  static get fields() {
    return fields
  }
}
