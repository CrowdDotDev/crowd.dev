import { i18n, init as i18nInit } from '@/i18n'
import { GenericModel } from '@/shared/model/generic-model'
import Storage from '@/security/storage'
import ImagesField from '@/shared/fields/images-field'

i18nInit()

function label(name) {
  return i18n(`settings.fields.${name}`)
}

const fields = {
  backgroundImages: new ImagesField(
    'backgroundImages',
    label('backgroundImages'),
    Storage.values.settingsBackgroundImages,
    { max: 1 }
  ),
  logos: new ImagesField(
    'logos',
    label('logos'),
    Storage.values.settingsLogos,
    { max: 1 }
  )
}

export class SettingsModel extends GenericModel {
  static get fields() {
    return fields
  }
}
