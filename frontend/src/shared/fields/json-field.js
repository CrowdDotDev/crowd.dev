import * as yup from 'yup'
import GenericField from '@/shared/fields/generic-field'

export default class JsonField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label)
    this.filterable = config.filterable || false
    this.required = config.required
    this.nonEmpty = config.nonEmpty
  }
  forPresenter(value) {
    return value
  }

  forFormInitialValue(value) {
    return value
  }

  forFormRules() {
    let yupChain = yup.mixed().label(this.label)

    if (this.required) {
      yupChain = yupChain.required()
    }

    if (this.nonEmpty) {
      yupChain = yupChain.test({
        name: 'valid required json',
        test: (json) => {
          if (!this.required && !json) {
            return true
          }
          // Object cannot be null or empty and each key must have a value
          return (
            !!json &&
            Object.keys(json).length !== 0 &&
            Object.keys(json).every((k) => !!k && !!json[k])
          )
        }
      })
    }

    return yupChain
  }

  forFormCast() {
    let yupChain = yup.mixed().label(this.label)

    if (this.required) {
      yupChain = yupChain.required()
    }

    if (this.nonEmpty) {
      yupChain = yupChain.test({
        name: 'valid required json',
        test: (json) => {
          if (!this.required && !json) {
            return true
          }
          // Object cannot be null or empty and each key must have a value
          return (
            !!json &&
            Object.keys(json).length !== 0 &&
            Object.keys(json).every((k) => !!k && !!json[k])
          )
        }
      })
    }

    return yupChain
  }

  forFilter() {
    return yup.mixed().label(this.label)
  }

  forFilterPreview(record) {
    return this.config.customFilterPreview
      ? this.config.customFilterPreview(record)
      : record.label
  }

  forExport() {
    return yup
      .mixed()
      .label(this.label)
      .transform((value, originalValue) => {
        return JSON.stringify(originalValue, null, 2)
      })
  }

  forImport() {
    return yup.mixed().label(this.label)
  }
}
