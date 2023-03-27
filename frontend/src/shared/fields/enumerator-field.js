import isString from 'lodash/isString';
import * as yup from 'yup';
import { i18n } from '@/i18n';
import GenericField from '@/shared/fields/generic-field';

export default class EnumeratorField extends GenericField {
  constructor(name, label, options, config = {}) {
    super(name, label);
    this.options = options || [];
    this.required = config.required;
    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.filterable = config.filterable || false;
  }

  id(option) {
    if (!option) {
      return option;
    }

    if (isString(option)) {
      return option;
    }

    return option.id;
  }

  label(option) {
    if (!option) {
      return option;
    }

    if (isString(option)) {
      return option;
    }

    return option.label;
  }

  forPresenter(value) {
    const option = this.options.find(
      (o) => o.id === this.id(value),
    );
    if (!option) {
      return 'test';
    }
    return option.label;
  }

  forFilterPreview(value) {
    const option = this.options.find(
      (o) => o.id === this.id(value),
    );

    if (option) {
      return this.label(option);
    }

    return value;
  }

  forFormInitialValue(value) {
    return this.id(value);
  }

  forFilterInitialValue(value) {
    return this.id(value);
  }

  forFilterCast() {
    return yup.string().nullable(true).label(this.label);
  }

  forFormRules() {
    const output = [];

    if (this.required) {
      output.push({
        required: Boolean(this.required),
        message: i18n('validation.string.selected').replace(
          '{path}',
          this.label,
        ),
      });
    }

    return output;
  }

  forFormCast() {
    return yup.string().nullable(true).label(this.label);
  }

  forExport() {
    return yup.mixed().label(this.label);
  }

  forImport() {
    let yupChain = yup
      .string()
      .label(this.label)
      .nullable(true)
      .oneOf([
        null,
        ...this.options.map((option) => this.id(option)),
      ]);

    if (this.required) {
      yupChain = yupChain.required(
        i18n('validation.string.selected'),
      );
    }

    return yupChain;
  }
}
