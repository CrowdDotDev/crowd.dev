import * as yup from 'yup'
import GenericField from '@/shared/fields/generic-field'
import { i18n } from '@/i18n'

export default class DecimalField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label)

    this.required = config.required
    this.min = config.min
    this.max = config.max
    this.scale = config.scale
    this.placeholder = config.placeholder
    this.hint = config.hint
    this.filterable = config.filterable || false
    this.custom = config.custom
  }

  forPresenter(value) {
    if (!value) {
      return value
    }

    if (this.scale === undefined || this.scale === null) {
      return value
    }

    return Number(value).toFixed(this.scale)
  }

  forFilter() {
    return {
      name: this.name,
      label: this.label,
      custom: this.custom,
      props: {},
      defaultValue: [],
      value: [],
      defaultOperator: 'eq',
      operator: 'eq',
      type: 'number'
    }
  }

  forFilterPreview(value) {
    return value
      ? this.scale
        ? Number(value).toFixed(this.scale)
        : Number(value)
      : null
  }

  forFormInitialValue(value) {
    return value
  }

  forFilterInitialValue(value) {
    return value
  }

  forFilterCast() {
    return yup.number().nullable(true).label(this.label)
  }

  forFormCast() {
    return yup.number().nullable(true).label(this.label)
  }

  forFormRules() {
    const output = []

    output.push({
      type: 'number',
      message: i18n('validation.number.invalid').replace(
        '${path}',
        this.label
      )
    })

    if (this.required) {
      output.push({
        type: 'number',
        required: Boolean(this.required),
        message: i18n('validation.mixed.required').replace(
          '${path}',
          this.label
        )
      })
    }

    if (this.min || this.min === 0) {
      output.push({
        type: 'number',
        min: this.min,
        message: i18n('validation.number.min')
          .replace('${path}', this.label)
          .replace('${min}', this.min)
      })
    }

    if (this.max || this.max === 0) {
      output.push({
        type: 'number',
        max: this.max,
        message: i18n('validation.number.max')
          .replace('${path}', this.label)
          .replace('${max}', this.max)
      })
    }

    return output
  }

  forExport() {
    return yup
      .mixed()
      .label(this.label)
      .transform((value) => this.forPresenter(value))
  }

  forImport() {
    let yupChain = yup
      .number()
      .nullable(true)
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

    return yupChain
  }
}
