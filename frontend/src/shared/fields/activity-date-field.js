import StringField from '@/shared/fields/string-field';
import { formatDate } from '@/utils/date';

export default class ActivityDateField extends StringField {
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
        value: formatDate({
          subtractDays: 1,
        }),
        label: 'Last 24 hours',
      },
      {
        value: formatDate({
          subtractDays: 7,
        }),
        label: 'Last 7 days',
      },
      {
        value: formatDate({
          subtractDays: 14,
        }),
        label: 'Last 14 days',
      },
      {
        value: formatDate({
          subtractDays: 30,
        }),
        label: 'Last 30 days',
      },
      {
        value: formatDate({
          subtractDays: 90,
        }),
        label: 'Last 90 days',
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
      defaultOperator: 'gte',
      operator: 'gte',
      type: 'select',
    };
  }
}
