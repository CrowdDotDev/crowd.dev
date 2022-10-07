import * as yup from 'yup'
import GenericField from '@/shared/fields/generic-field'

export default class JsonField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label)
    this.filterable = config.filterable || false
  }
  forPresenter(value) {
    return value
  }

  forFormInitialValue(value) {
    return value
  }

  forFormRules() {
    return yup.mixed().label(this.label)
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
