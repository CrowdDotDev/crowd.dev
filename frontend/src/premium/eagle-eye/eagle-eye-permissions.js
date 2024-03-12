import { PermissionChecker } from '@/modules/user/permission-checker';
import Permissions from '@/security/permissions';

export class EagleEyePermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser,
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
