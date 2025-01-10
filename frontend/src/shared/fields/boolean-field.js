import * as yup from 'yup';
import GenericField from '@/shared/fields/generic-field';

export default class BooleanField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label);

    this.hint = config.hint;
    this.yesLabel = config.yesLabel || 'Yes';
    this.noLabel = config.noLabel || 'No';
    this.filterable = config.filterable || false;
    this.custom = config.custom || false;
  }

  forPresenter(value) {
    return value ? this.yesLabel : this.noLabel;
  }

  forFilter() {
    return {
      name: this.name,
      label: this.label,
      custom: this.custom,
      props: {},
      defaultValue: null,
      value: null,
      defaultOperator: 'eq',
      operator: null,
      type: 'boolean',
    };
  }

  forFilterPreview(value) {
    if (value == null) {
      return null;
    }
    return value ? this.yesLabel : this.noLabel;
  }

  forFilterInitialValue(value) {
    return value;
  }

  forFormInitialValue(value) {
    return value;
  }

  forFormCast() {
    return yup.bool().default(false).label(this.label);
  }

  forFilterCast() {
    return yup.bool().nullable(true).label(this.label);
  }

  forExport() {
    return yup
      .bool()
      .nullable(true)
      .default(false)
      .label(this.label);
  }

  forImport() {
    return yup.bool().default(false).label(this.label);
  }
}
