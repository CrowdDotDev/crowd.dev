import { PermissionChecker } from '@/modules/user/permission-checker';
import Permissions from '@/security/permissions';

export class SettingsPermissions {
  constructor(tenant, user) {
    const permissionChecker = new PermissionChecker(
      tenant,
      user,
    );

    this.read = permissionChecker.match(
      Permissions.values.settingsRead,
    );

    this.edit = permissionChecker.match(
      Permissions.values.settingsEdit,
    );
    this.lockedForCurrentPlan = permissionChecker.lockedForCurrentPlan(
      Permissions.values.settingsEdit,
    );
  }
}
