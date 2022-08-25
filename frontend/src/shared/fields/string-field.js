import * as yup from 'yup'
import GenericField from '@/shared/fields/generic-field'
import { i18n } from '@/i18n'

export default class StringField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label)

    this.placeholder = config.placeholder
    this.hint = config.hint
    this.required = config.required
    this.matches = config.matches
    this.min = config.min
    this.max = config.max
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
    const output = []

    if (this.required) {
      output.push({
        required: Boolean(this.required),
        message: i18n('validation.mixed.required').replace(
          '${path}',
          this.label
        )
      })
    }

    if (this.min || this.min === 0) {
      output.push({
        min: this.min,
        message: i18n('validation.string.min')
          .replace('${path}', this.label)
          .replace('${min}', this.min)
      })
    }

    if (this.max || this.max === 0) {
      output.push({
        max: this.max,
        message: i18n('validation.string.max')
          .replace('${path}', this.label)
          .replace('${max}', this.max)
      })
    }

    if (this.matches) {
      output.push({
        pattern: this.matches,
        message: i18n('validation.mixed.default').replace(
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

    if (this.min || this.min === 0) {
      yupChain = yupChain.min(this.min)
    }

    if (this.max) {
      yupChain = yupChain.max(this.max)
    }

    if (this.matches) {
      yupChain = yupChain.matches(/^[0-9]/)
    }

    return yupChain
  }
}
