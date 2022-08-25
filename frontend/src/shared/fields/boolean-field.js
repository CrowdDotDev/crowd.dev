import * as yup from 'yup'
import { i18n } from '@/i18n'
import GenericField from '@/shared/fields/generic-field'

export default class BooleanField extends GenericField {
  constructor(
    name,
    label,
    {
      hint = undefined,
      yesLabel = undefined,
      noLabel = undefined
    } = {}
  ) {
    super(name, label)

    this.hint = hint
    this.yesLabel = yesLabel || i18n('common.yes')
    this.noLabel = noLabel || i18n('common.no')
  }

  forPresenter(value) {
    return value ? this.yesLabel : this.noLabel
  }

  forFilterPreview(value) {
    return value == null
      ? null
      : value
      ? this.yesLabel
      : this.noLabel
  }

  forFilterInitialValue(value) {
    return value
  }

  forFormInitialValue(value) {
    return value
  }

  forFormCast() {
    return yup.bool().default(false).label(this.label)
  }

  forFilterCast() {
    return yup.bool().nullable(true).label(this.label)
  }

  forExport() {
    return yup
      .bool()
      .nullable(true)
      .default(false)
      .label(this.label)
  }

  forImport() {
    return yup.bool().default(false).label(this.label)
  }
}
