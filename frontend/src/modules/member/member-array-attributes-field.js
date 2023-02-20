import StringField from '@/shared/fields/string-field'

export default class MemberArrayAttributesField extends StringField {
  constructor(name, label, config = {}) {
    super(name, label)

    this.placeholder = config.placeholder
    this.hint = config.hint
    this.required = config.required
    this.matches = config.matches
    this.filterable = config.filterable || false
    this.custom = config.custom || false
    this.options = config.options
  }

  dropdownOptions() {
    return this.options.sort((x, y) => {
      return x.label < y.label
        ? -1
        : x.label > y.label
        ? 1
        : 0
    })
  }

  forFilter() {
    return {
      name: this.name,
      label: this.label,
      custom: this.custom,
      props: {
        options: this.dropdownOptions(),
        multiple: true
      },
      defaultValue: [],
      value: [],
      defaultOperator: 'contains',
      operator: 'contains',
      type: 'select-multi'
    }
  }
}
