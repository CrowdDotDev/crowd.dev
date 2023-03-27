import * as yup from 'yup';
import moment from 'moment';
import { i18n } from '@/i18n';
import GenericField from '@/shared/fields/generic-field';
import { formatDate } from '@/utils/date';

export default class DateField extends GenericField {
  constructor(name, label, config = {}) {
    super(name, label);

    this.required = config.required;
    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.filterable = config.filterable || false;
    this.custom = config.custom;
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
    };
  }

  forPresenter(value) {
    return value;
  }

  forFilterPreview(value) {
    return value ? formatDate({ timestamp: value }) : null;
  }

  forImportViewTable(value) {
    return value ? formatDate({ timestamp: value }) : null;
  }

  forFilterCast() {
    return yup
      .mixed()
      .nullable(true)
      .label(this.label)
      .transform((value) => (value ? formatDate({ timestamp: value }) : null));
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

  forFormInitialValue(value) {
    return value ? moment(value, 'YYYY-MM-DD') : null;
  }

  forFormCast() {
    return yup
      .mixed()
      .nullable(true)
      .label(this.label)
      .transform((value) => (value ? formatDate({ timestamp: value }) : null));
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

          return moment(value, 'YYYY-MM-DD').isValid();
        },
      )
      .transform((value) => (value ? formatDate({ timestamp: value }) : null));

    if (this.required) {
      yupChain = yupChain.required();
    }

    return yupChain;
  }
}
