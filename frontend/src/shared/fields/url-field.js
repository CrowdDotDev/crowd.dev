import * as yup from 'yup'
import StringField from '@/shared/fields/string-field'
import { i18n } from '@/i18n'

export default class UrlField extends StringField {
  constructor(name, label, config = {}) {
    super(name, label)

    this.placeholder = config.placeholder
    this.hint = config.hint
    this.required = config.required
    this.filterable = config.filterable || false
  }

  forPresenter(value) {
    return value
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
        validator: _isValidUrl,
        message: `Invalid URL, please include the full link (ex: https://crowd.dev)`
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

function _isValidUrl(rule, value, callback) {
  if (!value) {
    callback()
    return
  }

  if (
    value.match(
      /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/gm
    )
  ) {
    callback()
    return
  }

  callback(new Error('Invalid URL'))
}
