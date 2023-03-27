import * as yup from 'yup';
import GenericField from '@/shared/fields/generic-field';
import { i18n } from '@/i18n';

export default class ArrayField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label);
    this.required = config.required;
  }

  forFormRules() {
    return {
      type: 'array',
      required: Boolean(this.required),
      message: i18n('validation.mixed.required').replace(
        '{path}',
        this.label,
      ),
    };
  }

  forFormCast() {
    return yup.array().nullable(true).label(this.label);
  }
}
