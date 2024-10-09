import * as yup from 'yup';
import isInteger from 'lodash/isInteger';
import GenericField from '@/shared/fields/generic-field';

export default class IntegerField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label);

    this.required = config.required;
    this.min = config.min;
    this.max = config.max;
    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.filterable = config.filterable || false;
    this.custom = config.custom || false;
  }

  forPresenter(value) {
    return value;
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
      operator: 'eq',
      type: 'number',
    };
  }

  forFormInitialValue(value) {
    return value;
  }

  forFilterInitialValue(value) {
    return value;
  }

  forFilterCast() {
    return yup
      .number()
      .integer()
      .nullable(true)
      .label(this.label);
  }

  forFormCast() {
    return yup
      .number()
      .integer()
      .nullable(true)
      .label(this.label);
  }

  forFormRules() {
    const output = [];

    const integerFn = (rule, value, callback) => {
      if (!value) {
        callback();
        return;
      }

      if (isInteger(value)) {
        callback();
        return;
      }

      callback(
        new Error(`${this.label} must be an integer`),
      );
    };

    output.push({
      validator: integerFn,
    });

    if (this.required) {
      output.push({
        type: 'number',
        required: Boolean(this.required),
        message: 'This field is required',
      });
    }

    if (this.min || this.min === 0) {
      output.push({
        type: 'number',
        min: this.min,
        message: `${this.label} must be greater than or equal to ${this.min}`,
      });
    }

    if (this.max || this.max === 0) {
      output.push({
        type: 'number',
        max: this.max,
        message: `${this.label} must be less than or equal to ${this.max}`,
      });
    }

    return output;
  }

  forExport() {
    return yup.mixed().label(this.label);
  }

  forImport() {
    let yupChain = yup
      .number()
      .integer()
      .nullable(true)
      .label(this.label);

    if (this.required) {
      yupChain = yupChain.required();
    }

    if (this.min || this.min === 0) {
      yupChain = yupChain.min(this.min);
    }

    if (this.max) {
      yupChain = yupChain.max(this.max);
    }

    return yupChain;
  }
}
