import IntegerRangeField from '@/shared/fields/integer-range-field';

export default class MemberEngagementLevelField extends IntegerRangeField {
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
        value: [0, 1],
        label: 'Silent',
      },
      {
        value: [2, 3],
        label: 'Quiet',
      },
      {
        value: [4, 6],
        label: 'Engaged',
      },
      {
        value: [7, 8],
        label: 'Fan',
      },
      {
        value: [9, 10],
        label: 'Ultra',
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
      defaultOperator: null,
      operator: null,
      type: 'select-multi',
    };
  }
}
