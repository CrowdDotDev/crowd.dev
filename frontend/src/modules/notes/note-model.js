import { i18n, init as i18nInit } from '@/i18n'
import IdField from '@/shared/fields/id-field'
import { GenericModel } from '@/shared/model/generic-model'
import StringField from '@/shared/fields/string-field'

function label(name) {
  return i18n(`entities.notes.fields.${name}`)
}

const fields = {
  id: new IdField('id', label('id')),
  body: new StringField('body', label('body'))
}

export class NoteModel extends GenericModel {
  static get fields() {
    i18nInit()
    return fields
  }
}
