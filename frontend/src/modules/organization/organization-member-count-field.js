import IntegerRangeField from '@/shared/fields/integer-range-field';

export default class OrganizationMemberCountField extends IntegerRangeField {
  constructor(name, label, config = {}) {
    super(name, label);

    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.required = config.required;
    this.matches = config.matches;
    this.filterable = config.filterable || false;
    this.custom = config.custom || false;
  }

  forFilter() {
    return {
      name: this.name,
      label: this.label,
      custom: this.custom,
      props: {},
      defaultValue: [],
      value: [],
      defaultOperator: 'between',
      operator: 'between',
      type: 'number',
    };
  }
}
