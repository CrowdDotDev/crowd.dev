import isString from 'lodash/isString'
import * as yup from 'yup'
import { i18n } from '@/i18n'
import GenericField from '@/shared/fields/generic-field'

export default class EnumeratorMultipleField extends GenericField {
  constructor(name, label, options, config = {}) {
    super(name, label)
    this.options = options || []
    this.min = config.min
    this.max = config.max
    this.required = config.required
    this.placeholder = config.placeholder
    this.hint = config.hint
  }

  _id(option) {
    if (!option) {
      return option
    }

    if (isString(option)) {
      return option
    }

    return option.id
  }

  _label(option) {
    if (!option) {
      return option
    }

    if (isString(option)) {
      return option
    }

    return option.label
  }

  forPresenter(values) {
    return (values || []).map((value) => {
      const option = this.options.find(
        (option) => option.id === this._id(value)
      )

      if (option) {
        return this._label(option)
      }

      return value
    })
  }

  forFilterPreview(values) {
    return (values || [])
      .map((value) => {
        const option = this.options.find(
          (option) => option.id === this._id(value)
        )

        if (option) {
          return this._label(option)
        }

        return value
      })
      .join(', ')
  }

  forFormInitialValue(values) {
    return (values || []).map((value) => this._id(value))
  }

  forFilterInitialValue(values) {
    return (values || []).map((value) => this._id(value))
  }

  forFilterCast() {
    return yup
      .array()
      .nullable(true)
      .compact()
      .ensure()
      .of(yup.string().trim())
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue) {
          return originalValue
        }

        if (Array.isArray(originalValue)) {
          return originalValue
        }

        return [originalValue]
      })
  }

  forFormRules() {
    const output = []

    if (this.required) {
      output.push({
        type: 'array',
        required: Boolean(this.required),
        message: i18n('validation.mixed.required').replace(
          '${path}',
          this.label
        )
      })
    }

    if (this.min || this.min === 0) {
      output.push({
        type: 'array',
        min: this.min,
        message: i18n('validation.array.min')
          .replace('${path}', this.label)
          .replace('${min}', this.min)
      })
    }

    if (this.max || this.max === 0) {
      output.push({
        type: 'array',
        max: this.max,
        message: i18n('validation.array.max')
          .replace('${path}', this.label)
          .replace('${max}', this.max)
      })
    }

    return output
  }

  forFormCast() {
    return yup
      .array()
      .compact()
      .ensure()
      .of(yup.string().trim())
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue) {
          return originalValue
        }

        if (Array.isArray(originalValue)) {
          return originalValue
        }

        return [originalValue]
      })
  }

  forExport() {
    return yup.mixed().label(this.label)
  }

  forImport() {
    let yupChain = yup
      .mixed()
      .label(this.label)
      .transform((value) =>
        Array.isArray(value)
          ? value
          : (value || '')
              .trim()
              .split(' ')
              .filter((item) => Boolean(item))
              .map((item) => item.trim())
      )

    if (this.required) {
      yupChain = yupChain.required()
    }

    return yupChain
  }
}
