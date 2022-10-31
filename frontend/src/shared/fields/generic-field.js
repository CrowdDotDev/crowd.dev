import { i18n } from '../../i18n'

export default class GenericField {
  constructor(name, label, config = {}) {
    this.name = name
    this.label = label
    this.placeholder = config.placeholder
    this.hint = config.hint
    this.required = config.required
    this.config = config
    this.filterable = config.filterable || false
    this.custom = config.custom || false
  }

  forImportViewTable(value) {
    if (value == null) {
      return null
    }

    return String(value)
  }

  forPresenter(value) {
    return value
  }

  forFilterPreview(value) {
    return value
  }

  forFormInitialValue(value) {
    return value
  }

  forFilterInitialValue(value) {
    return value
  }

  forFilterRules() {
    return []
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

    return []
  }

  forFormCast() {
    return undefined
  }

  forFilterCast() {
    return undefined
  }

  forExport() {
    return undefined
  }

  forImport() {
    return undefined
  }
}
