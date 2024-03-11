import { PermissionChecker } from '@/modules/user/permission-checker';
import Permissions from '@/security/permissions';

export class EagleEyePermissions {
  constructor(tenant, user) {
    const permissionChecker = new PermissionChecker(
      tenant,
      user,
    );

    this.read = permissionChecker.match(
      Permissions.values.eagleEyeContentRead,
    );
    this.create = permissionChecker.match(
      Permissions.values.eagleEyeContentCreate,
    );
    this.edit = permissionChecker.match(
      Permissions.values.eagleEyeContentEdit,
    );
    this.action = permissionChecker.match(
      Permissions.values.eagleEyeActionCreate,
    );
    this.lockedForCurrentPlan = permissionChecker.lockedForCurrentPlan(
      Permissions.values.eagleEyeRead,
    );
  }
}
