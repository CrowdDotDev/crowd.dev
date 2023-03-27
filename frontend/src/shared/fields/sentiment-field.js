import GenericField from '@/shared/fields/string-field';

export default class SentimentField extends GenericField {
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
        value: 'positive',
        label: 'Positive',
        range: {
          gte: 67,
        },
      },
      {
        value: 'neutral',
        label: 'Neutral',
        range: {
          between: [33, 67],
        },
      },
      {
        value: 'negative',
        label: 'Negative',
        range: {
          lte: 33,
        },
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
