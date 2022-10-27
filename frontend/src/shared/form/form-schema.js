import * as yup from 'yup'

export class FormSchema {
  constructor(fields) {
    this.fields = fields
    this.schema = this.buildSchema()
  }

  initialValues(record) {
    record = record || {}

    const intialValues = {}

    this.fields.forEach((field) => {
      if (field.forFormInitialValue(record[field.name])) {
        intialValues[field.name] =
          field.forFormInitialValue(record[field.name])
      }
    })

    return intialValues
  }

  buildSchema() {
    const shape = {}

    this.fields.forEach((field) => {
      shape[field.name] = field.forFormCast()
    })

    return yup.object().shape(shape)
  }

  rules() {
    const rules = {}

    this.fields.forEach((field) => {
      rules[field.name] = field.forFormRules()
    })

    return rules
  }

  cast(values) {
    return { ...this.schema.cast(values) }
  }

  isValidSync(values) {
    return this.schema.isValidSync(values)
  }
}
