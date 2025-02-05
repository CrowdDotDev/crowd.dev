import * as yup from 'yup';
import GenericField from '@/shared/fields/generic-field';
import { dateHelper } from '@/shared/date-helper/date-helper';

export default class DateTimeField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label);

    this.required = config.required;
    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.filterable = config.filterable || false;
    this.formatter = config.formatter || null;
  }

  forPresenter(value) {
    if (this.formatter) {
      return this.formatter(value);
    }
    return value
      ? dateHelper(value).format('YYYY-MM-DD HH:mm')
      : null;
  }

  forFilterPreview(value) {
    if (this.formatter) {
      return this.formatter(value);
    }
    return value
      ? dateHelper(value).format('YYYY-MM-DD HH:mm')
      : null;
  }

  forImportViewTable(value) {
    return value
      ? dateHelper(value).format('YYYY-MM-DD HH:mm')
      : null;
  }

  forFormInitialValue(value) {
    return value ? dateHelper(value) : null;
  }

  forFormRules() {
    const output = [];

    if (this.required) {
      output.push({
        required: true,
        message: 'This field is required',
      });
    }

    return output;
  }

  forFormCast() {
    return yup
      .mixed()
      .nullable(true)
      .label(this.label)
      .transform((value) => (value ? dateHelper(value) : null));
  }

  forExport() {
    return yup.mixed().label(this.label);
  }

  forImport() {
    let yupChain = yup
      .mixed()
      .nullable(true)
      .label(this.label)
      .test(
        'is-date',
        '{path} is invalid',
        (value) => {
          if (!value) {
            return true;
          }

          return value instanceof Date;
        },
      );

    if (this.required) {
      yupChain = yupChain.required();
    }

    return yupChain;
  }

  forFilter() {
    return {
      name: this.name,
      label: this.label,
      custom: this.custom,
      props: {},
      defaultValue: [],
      value: [],
      defaultOperator: 'eq',
      operator: null,
      type: 'date',
      include: true,
    };
  }
}
