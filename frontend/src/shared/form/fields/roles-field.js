import * as yup from 'yup';
import StringArrayField from '@/shared/fields/string-array-field';
import Roles from '@/security/roles';

export class RolesField extends StringArrayField {
  constructor(name, fieldLabel, config = {}) {
    super(name, fieldLabel, config);

    this.options = Roles.selectOptions;
  }

  forExport() {
    return yup
      .mixed()
      .label(this.label)
      .transform((values) => (values
        ? values
          .map((value) => Roles.labelOf(value))
          .join(' ')
        : null));
  }
}
