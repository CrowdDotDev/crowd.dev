import StringField from '@/shared/fields/string-field';

export default class OrganizationTypeField extends StringField {
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
        value: 'educational',
        label: 'Educational',
      },
      {
        value: 'government',
        label: 'Government',
      },
      {
        value: 'nonprofit',
        label: 'Nonprofit',
      },
      {
        value: 'private',
        label: 'Private',
      },
      {
        value: 'public',
        label: 'Public',
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
        multiple: false,
      },
      defaultValue: null,
      value: null,
      defaultOperator: 'eq',
      operator: 'eq',
      type: 'select',
    };
  }
}
