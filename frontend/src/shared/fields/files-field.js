import * as yup from 'yup'
import GenericField from '@/shared/fields/generic-field'
import { i18n } from '@/i18n'

export default class FilesField extends GenericField {
  constructor(name, label, storage, config = {}) {
    super(name, label)

    this.storage = storage
    this.required = config.required
    this.min = config.min
    this.max = config.max
    this.formats = config.formats
    this.hint = config.hint
  }

  forPresenter(value) {
    return value || []
  }

  forFormInitialValue(value) {
    return value || []
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
    return yup.array().nullable(true).label(this.label)
  }

  forExport() {
    return yup
      .mixed()
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue || !originalValue.length) {
          return null
        }

        return originalValue
          .map((value) => value.downloadUrl)
          .join(' ')
      })
  }

  forImport() {
    let yupChain = yup
      .array()
      .compact()
      .ensure()
      .label(this.label)
      .nullable(true)
      .transform((value, originalValue) => {
        if (!originalValue) {
          return null
        }

        if (Array.isArray(originalValue)) {
          return originalValue
        }

        return originalValue
          .trim()
          .split(' ')
          .map((value) => {
            return {
              name: value.trim(),
              publicUrl: value.trim(),
              new: true
            }
          })
      })

    if (this.required || this.min) {
      yupChain = yupChain.required()
    }

    if (this.min || this.min === 0) {
      yupChain = yupChain.min(this.min)
    } else if (this.required) {
      yupChain = yupChain.min(1)
    }

    if (this.max) {
      yupChain = yupChain.max(this.max)
    }

    return yupChain
  }
}
