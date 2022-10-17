import * as yup from 'yup'
import StringField from '@/shared/fields/string-field'
import { i18n } from '@/i18n'

export default class DomainField extends StringField {
  constructor(name, label, config = {}) {
    super(name, label)

    this.placeholder = config.placeholder
    this.hint = config.hint
    this.required = config.required
    this.filterable = config.filterable || false
    this.custom = config.custom || false
  }

  forPresenter(value) {
    return value
  }

  forFilter() {
    return {
      name: this.name,
      label: this.label,
      custom: this.custom,
      props: {},
      defaultValue: null,
      value: null,
      defaultOperator: 'textContains',
      operator: 'textContains',
      type: 'string'
    }
  }

  forFilterPreview(value) {
    if (typeof value === 'object' && value) {
      return value.id
    }
    return value
  }

  forFormInitialValue(value) {
    return value
  }

  forFilterInitialValue(value) {
    return value
  }

  forFormRules() {
    const output = [
      {
        validator: _isValidDomain,
        message: `Invalid domain`
      }
    ]

    if (this.required) {
      output.push({
        required: Boolean(this.required),
        message: i18n('validation.mixed.required').replace(
          '${path}',
          this.label
        )
      })
    }

    return output
  }

  forFormCast() {
    return yup
      .string()
      .nullable(true)
      .trim()
      .label(this.label)
  }

  forFilterCast() {
    return yup
      .string()
      .nullable(true)
      .trim()
      .label(this.label)
  }

  forExport() {
    return yup.mixed().label(this.label)
  }

  forImport() {
    let yupChain = yup
      .string()
      .nullable(true)
      .trim()
      .label(this.label)

    if (this.required) {
      yupChain = yupChain.required()
    }

    return yupChain
  }
}

function _isValidDomain(rule, value, callback) {
  if (!value) {
    callback()
    return
  }

  if (
    value.match(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/gm
    )
  ) {
    callback()
    return
  }

  callback(new Error('Invalid domain'))
}
