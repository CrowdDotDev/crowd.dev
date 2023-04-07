import * as yup from 'yup';
import moment from 'moment';
import GenericField from '@/shared/fields/generic-field';
import { i18n } from '@/i18n';

export default class DateTimeField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label);

    this.required = config.required;
    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.filterable = config.filterable || false;
  }

  forPresenter(value) {
    return value
      ? moment(value).format('YYYY-MM-DD HH:mm')
      : null;
  }

  forFilterPreview(value) {
    return value
      ? moment(value).format('YYYY-MM-DD HH:mm')
      : null;
  }

  forImportViewTable(value) {
    return value
      ? moment(value).format('YYYY-MM-DD HH:mm')
      : null;
  }

  forFormInitialValue(value) {
    return value ? moment(value) : null;
  }

  forFormRules() {
    const output = [];

    if (this.required) {
      output.push({
        required: true,
        message: i18n('validation.mixed.required').replace(
          '{path}',
          this.label,
        ),
      });
    }

    return output;
  }

  forFormCast() {
    return yup
      .mixed()
      .nullable(true)
      .label(this.label)
      .transform((value) => (value ? moment(value) : null));
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
        i18n('validation.mixed.default'),
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
