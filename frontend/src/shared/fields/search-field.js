import GenericField from '@/shared/fields/generic-field'

export default class SearchField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label)

    this.filterable = config.filterable || false
    this.custom = config.custom || false
    this.fields = config.fields
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
      type: 'search',
      fields: this.fields,
      show: false
    }
  }
}
