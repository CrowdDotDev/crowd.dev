import * as yup from 'yup';

export default class GenericField {
  constructor(name, label, config = {}) {
    this.name = name;
    this.label = label;
    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.required = config.required;
    this.requiredUnless = config.requiredUnless;
    this.config = config;
    this.filterable = config.filterable || false;
    this.custom = config.custom || false;
  }

  forImportViewTable(value) {
    if (value == null) {
      return null;
    }

    return String(value);
  }

  forPresenter(value) {
    return value;
  }

  forFilterPreview(value) {
    return value;
  }

  forFormInitialValue(value) {
    return value;
  }

  forFilterInitialValue(value) {
    return value;
  }

  forFilterRules() {
    return [];
  }

  forFormRules() {
    let yupChain = yup.mixed().label(this.label);

    if (this.required) {
      yupChain = yupChain.required();
    }

    if (this.requiredUnless) {
      yupChain = yupChain.when(this.requiredUnless, {
        is: (value) => !value || value === '',
        then: (schema) => schema.required(),
      });
    }

    return yupChain;
  }

  forFormCast() {
    return undefined;
  }

  forFilterCast() {
    return undefined;
  }

  forExport() {
    return undefined;
  }

  forImport() {
    return undefined;
  }
}
