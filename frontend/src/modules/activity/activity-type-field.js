import JSONField from '@/shared/fields/json-field'
import en from '@/i18n/en'

export default class ActivityTypeField extends JSONField {
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
        label: {
          type: 'platform',
          key: 'github',
          value: 'GitHub'
        },
        nestedOptions: Object.entries(
          en.entities.activity.github
        ).map(([key, value]) => ({
          value: key,
          label: value
        }))
      },
      {
        label: {
          type: 'platform',
          key: 'twitter',
          value: 'Twitter'
        },
        nestedOptions: Object.entries(
          en.entities.activity.twitter
        ).map(([key, value]) => ({
          value: key,
          label: value
        }))
      },
      {
        label: {
          type: 'platform',
          key: 'discord',
          value: 'Discord'
        },
        nestedOptions: Object.entries(
          en.entities.activity.discord
        ).map(([key, value]) => ({
          value: key,
          label: value
        }))
      },
      {
        label: {
          type: 'platform',
          key: 'slack',
          value: 'Slack'
        },
        nestedOptions: Object.entries(
          en.entities.activity.slack
        ).map(([key, value]) => ({
          value: key,
          label: value
        }))
      },
      {
        label: {
          type: 'platform',
          key: 'devto',
          value: 'DEV'
        },
        nestedOptions: Object.entries(
          en.entities.activity.devto
        ).map(([key, value]) => ({
          value: key,
          label: value
        }))
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
      defaultOperator: null,
      operator: null,
      type: 'select-group'
    }
  }
}
