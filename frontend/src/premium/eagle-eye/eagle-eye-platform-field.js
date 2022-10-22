import StringField from '@/shared/fields/string-field'

export default class EagleEyePlatformField extends StringField {
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
        value: 'hacker_news',
        label: 'Hackernews'
      },
      {
        value: 'devto',
        label: 'DEV'
      },
      {
        value: 'github',
        label: 'GitHub',
        soon: true
      },
      {
        value: 'twitter',
        label: 'Twitter',
        soon: true
      },
      {
        value: 'stackoverflow',
        label: 'Stack Overflow',
        soon: true
      }
    ]
  }

  forFilter() {
    return {
      name: this.name,
      label: this.label,
      custom: this.custom,
      props: {
        options: this.dropdownOptions()
      },
      defaultValue: [],
      value: [],
      defaultOperator: null,
      operator: null,
      type: 'select-multi'
    }
  }
}
