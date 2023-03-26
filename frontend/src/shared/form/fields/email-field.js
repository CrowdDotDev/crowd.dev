import * as yup from 'yup';
import StringArrayField from '@/shared/fields/string-array-field';
import { i18n } from '@/i18n';

export class EmailsField extends StringArrayField {
  forFormRules() {
    let yupValidator = yup
      .array()
      .label(this.label)
      .of(
        yup
          .string()
          .email(i18n('user.validations.email'))
          .label(i18n('user.fields.email'))
          .max(255)
          .required(),
      );

    if (this.required) {
      yupValidator = yupValidator.required().min(1);
    }

    const validator = (rule, value, callback) => {
      try {
        yupValidator.validateSync(value);
        callback();
      } catch (error) {
        callback(error);
      }
    };

    return [{ validator }];
  }
}
