import _values from 'lodash/values';
import { i18n } from '@/i18n';

/**
 * This class defines the available roles of our app, along with some helper methods
 */
class Roles {
  static get values() {
    return {
      admin: 'admin',
      readonly: 'readonly',
    };
  }

  static labelOf(roleId) {
    if (!this.values[roleId]) {
      return roleId;
    }

    return i18n(`roles.${roleId}.label`);
  }

  static descriptionOf(roleId) {
    if (!this.values[roleId]) {
      return roleId;
    }

    return i18n(`roles.${roleId}.description`);
  }

  static get selectOptions() {
    return _values(this.values).map((value) => ({
      id: value,
      value,
      title: this.descriptionOf(value),
      label: this.labelOf(value),
    }));
  }
}

export default Roles;
