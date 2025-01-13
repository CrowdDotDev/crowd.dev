import * as yup from 'yup';
import GenericField from '@/shared/fields/generic-field';

export default class ArrayField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label);
    this.required = config.required;
  }

  forFormRules() {
    return {
      type: 'array',
      required: Boolean(this.required),
      message: 'This field is required',
    };
  }

  forFormCast() {
    return yup.array().nullable(true).label(this.label);
  }
}
