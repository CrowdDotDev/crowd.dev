import StringField from '@/shared/fields/string-field';

export default class OrganizationPlatformField extends StringField {
  constructor(name, label, config = {}) {
    super(name, label);

    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.required = config.required;
    this.matches = config.matches;
    this.filterable = config.filterable || false;
    this.custom = config.custom || false;
  }

  dropdownOptions() {
    return [
      {
        value: 'github',
        label: 'GitHub',
      },
      {
        value: 'linkedin',
        label: 'LinkedIn',
      },
      {
        value: 'twitter',
        label: 'X/Twitter',
      },
      {
        value: 'crunchbase',
        label: 'Crunchbase',
      },
    ];
  }

  forFilter() {
    return {
      name: this.name,
      label: this.label,
      custom: this.custom,
      props: {
        options: this.dropdownOptions(),
        multiple: true,
      },
      defaultValue: [],
      value: [],
      defaultOperator: 'contains',
      operator: 'contains',
      type: 'select-multi',
    };
  }
}
