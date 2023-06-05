import StringField from '@/shared/fields/string-field';

export default class OrganizationHeadcountField extends StringField {
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
        value: '1-10',
        label: '1-10',
      },
      {
        value: '11-50',
        label: '11-50',
      },
      {
        value: '51-200',
        label: '51-200',
      },
      {
        value: '201-500',
        label: '201-500',
      },
      {
        value: '501-1000',
        label: '501-1000',
      },
      {
        value: '1001-5000',
        label: '1001-5000',
      },
      {
        value: '5001-10000',
        label: '5001-10000',
      },
      {
        value: '10001+',
        label: '10001+',
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
