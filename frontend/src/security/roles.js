import _values from 'lodash/values';
import { i18n } from '@/i18n';

/**
 * This class defines the available roles of our app, along with some helper methods
 */
class Roles {
  static get values() {
    return {
      admin: 'admin',
      viewer: 'viewer',
      projectAdmin: 'projectAdmin',
    };
  }
}

export default Roles;
