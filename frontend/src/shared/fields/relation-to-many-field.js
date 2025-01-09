import * as yup from 'yup';
import GenericField from '@/shared/fields/generic-field';
import { i18n } from '@/i18n';

export default class RelationToManyField extends GenericField {
  constructor(
    name,
    label,
    viewUrl,
    readPermission,
    fetchFn,
    mapperFn,
    config = {},
  ) {
    super(name, label);

    this.required = config.required;
    this.min = config.min;
    this.max = config.max;
    this.placeholder = config.placeholder;
    this.hint = config.hint;

    if (config.required && !config.min) {
      this.min = 1;
    }

    this.fetchFn = fetchFn;
    this.mapperFn = mapperFn;
    this.viewUrl = viewUrl;
    this.filterable = config.filterable || false;
    this.custom = config.custom || false;
  }

  forPresenter(value) {
    if (!value) {
      return [];
    }

    return value.map((item) => this.mapperFn(item));
  }

  forFilter() {
    return {
      name: this.name,
      label: this.label,
      custom: this.custom,
      props: {
        fetchFn: this.fetchFn,
      },
      defaultValue: [],
      value: [],
      defaultOperator: null,
      operator: null,
      type: 'select-async',
      include: true,
    };
  }

  forFilterPreview(value) {
    return value
      .map((item) => (item && item.label) || null)
      .join(', ');
  }

  forFormInitialValue(value) {
    return this.forPresenter(value);
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
      .nullable(true)
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue || !originalValue.length) {
          return [];
        }

        return originalValue.map((item) => item.id);
      });
  }

  forFilterCast() {
    return yup
      .mixed()
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue) {
          return [];
        }

        return originalValue.map((item) => item.id);
      });
  }

  forExport() {
    return yup
      .mixed()
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue || !originalValue.length) {
          return null;
        }

        return originalValue
          .map((v) => v.id)
          .join(' ');
      });
  }

  forImport() {
    let yupChain = yup
      .array()
      .nullable(true)
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue) {
          return null;
        }

        if (Array.isArray(originalValue)) {
          return originalValue;
        }

        return originalValue
          .trim()
          .split(' ')
          .map((v) => v);
      });

    if (this.required || this.min) {
      yupChain = yupChain.required();
    }

    if (this.min || this.min === 0) {
      yupChain = yupChain.min(this.min);
    } else if (this.required) {
      yupChain = yupChain.min(1);
    }

    if (this.max) {
      yupChain = yupChain.max(this.max);
    }

    return yupChain;
  }
}
