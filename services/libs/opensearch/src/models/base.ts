import { OpensearchField } from '@crowd/types'

export default class OpensearchModelBase {
  fields: Record<string, OpensearchField>

  getAllFields(): Record<string, OpensearchField> {
    return this.fields
  }

  getField(key: string): OpensearchField {
    return this.fields[key]
  }

  fieldExists(key: string): boolean {
    return key in this.fields
  }
}
