import * as yup from 'yup'
import GenericField from '@/shared/fields/generic-field'
function _isJsonEmpty(required, json) {
  if (!required && !json) {
    return true
  }
  // Object cannot be null or empty and each key must have a value
  return (
    !!json &&
    Object.keys(json).length !== 0 &&
    Object.keys(json).every((k) => !!k && !!json[k])
  )
}

export default class JsonField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label)
    this.filterable = config.filterable || false
    this.required = config.required
    this.requiredUnless = config.requiredUnless
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

    if (this.nonEmpty && !this.requiredUnless) {
      yupChain = yupChain.test({
        name: 'valid required json',
        test: (json) => _isJsonEmpty(this.required, json)
      })
    }

    if (this.requiredUnless) {
      yupChain = yupChain.when(this.requiredUnless, {
        is: (value) => !value || value === '',
        then: (schema) =>
          schema.test((json) =>
            _isJsonEmpty(schema.required(), json)
          )
      })
    }

    return yupChain
  }

  forFormCast() {
    let yupChain = yup.mixed().label(this.label)

    if (this.required) {
      yupChain = yupChain.required()
    }

    if (this.nonEmpty && !this.requiredUnless) {
      yupChain = yupChain.test({
        name: 'valid required json',
        test: (json) => _isJsonEmpty(this.required, json)
      })
    }

    if (this.requiredUnless) {
      yupChain = yupChain.when(this.requiredUnless, {
        is: (value) => !value || value === '',
        then: (schema) =>
          schema.test((json) =>
            _isJsonEmpty(schema.required(), json)
          )
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
