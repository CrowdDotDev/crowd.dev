import * as yup from 'yup';
import GenericField from '@/shared/fields/generic-field';
import { i18n } from '@/i18n';

export default class StringArrayField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label);

    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.required = config.required;
    this.min = config.min;
    this.max = config.max;
    this.filterable = config.filterable || false;
  }

  forPresenter(value) {
    return value || [];
  }

  forFilterPreview(value) {
    return (value || []).join(' ');
  }

  forFormInitialValue(value) {
    return value || [];
  }

  forFilterInitialValue(value) {
    if (value && !Array.isArray(value)) {
      return [value];
    }

    return value || [];
  }

  forFormRules() {
    const output = [];

    if (this.required) {
      output.push({
        type: 'array',
        required: Boolean(this.required),
        message: i18n('validation.mixed.required').replace(
          '{path}',
          this.label,
        ),
      });
    }

    if (this.min || this.min === 0) {
      output.push({
        type: 'array',
        min: this.min,
        message: i18n('validation.array.min')
          .replace('{path}', this.label)
          .replace('{min}', this.min),
      });
    }

    if (this.max || this.max === 0) {
      output.push({
        type: 'array',
        max: this.max,
        message: i18n('validation.array.max')
          .replace('{path}', this.label)
          .replace('{max}', this.max),
      });
    }

    return output;
  }

  forFormCast() {
    return yup
      .array()
      .compact()
      .ensure()
      .of(yup.string().trim())
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue) {
          return originalValue;
        }

        if (Array.isArray(originalValue)) {
          return originalValue;
        }

        return [originalValue];
      });
  }

  forFilterCast() {
    return yup
      .array()
      .compact()
      .ensure()
      .of(yup.string().trim())
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue) {
          return originalValue;
        }

        if (Array.isArray(originalValue)) {
          return originalValue;
        }

        return [originalValue];
      });
  }

  forImport() {
    let yupChain = yup
      .mixed()
      .label(this.label)
      .transform((value) => (Array.isArray(value)
        ? value
        : (value || '')
          .trim()
          .split(' ')
          .filter((item) => Boolean(item))
          .map((item) => item.trim())));

    if (this.required) {
      yupChain = yupChain.required();
    }

    return yupChain;
  }

  forExport() {
    return yup.mixed().label(this.label);
  }
}
