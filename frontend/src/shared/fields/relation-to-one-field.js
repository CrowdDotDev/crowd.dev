import * as yup from 'yup';
import GenericField from '@/shared/fields/generic-field';

export default class RelationToOneField extends GenericField {
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

    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.required = config.required;
    this.fetchFn = fetchFn;
    this.mapperFn = mapperFn;
    this.viewUrl = viewUrl;
    this.readPermission = readPermission;
    this.filterable = config.filterable || false;
    this.custom = config.custom;
  }

  forPresenter(value) {
    return this.mapperFn(value);
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
    return (value && value.label) || null;
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

  forFormInitialValue(value) {
    return this.mapperFn(value);
  }

  forFilterInitialValue(value) {
    return this.mapperFn(value);
  }

  forFormCast() {
    return yup
      .mixed()
      .nullable(true)
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue) {
          return null;
        }

        return originalValue.id;
      });
  }

  forFilterCast() {
    return yup
      .mixed()
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue) {
          return null;
        }

        return originalValue.id;
      });
  }

  forExport() {
    return yup
      .mixed()
      .label(this.label)
      .transform((value, originalValue) => {
        if (!originalValue || !originalValue.id) {
          return null;
        }

        return originalValue.id;
      });
  }

  forImport() {
    let yupChain = yup
      .mixed()
      .nullable(true)
      .label(this.label);

    if (this.required) {
      yupChain = yupChain.required();
    }

    return yupChain;
  }
}
