import StringField from '@/shared/fields/string-field'

export default class ActivitySentimentField extends StringField {
  constructor(name, label, config = {}) {
    super(name, label)

    this.placeholder = config.placeholder
    this.hint = config.hint
    this.required = config.required
    this.matches = config.matches
    this.filterable = config.filterable || false
    this.custom = config.custom || false
  }

  dropdownOptions() {
    return [
      {
        value: 'positive',
        label: 'Positive'
      },
      {
        value: 'neutral',
        label: 'Neutral'
      },
      {
        value: 'negative',
        label: 'Negative'
      }
    ]
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
      defaultOperator: null,
      operator: null,
      type: 'select-multi'
    }
  }
}
