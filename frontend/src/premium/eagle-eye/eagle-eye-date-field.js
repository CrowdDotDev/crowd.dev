import StringField from '@/shared/fields/string-field'
import moment from 'moment'

export default class EagleEyeDateField extends StringField {
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
        value: moment()
          .subtract(1, 'days')
          .format('YYYY-MM-DD'),
        label: 'Last 24 hours'
      },
      {
        value: moment()
          .subtract(7, 'days')
          .format('YYYY-MM-DD'),
        label: 'Last 7 days'
      },
      {
        value: moment()
          .subtract(14, 'days')
          .format('YYYY-MM-DD'),
        label: 'Last 14 days'
      },
      {
        value: moment()
          .subtract(30, 'days')
          .format('YYYY-MM-DD'),
        label: 'Last 30 days'
      },
      {
        value: moment()
          .subtract(90, 'days')
          .format('YYYY-MM-DD'),
        label: 'Last 90 days'
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
        multiple: false
      },
      defaultValue: null,
      value: null,
      defaultOperator: 'gte',
      operator: 'gte',
      type: 'select'
    }
  }
}
