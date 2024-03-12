import Permissions from '@/security/permissions';
import { PermissionChecker } from '@/modules/user/permission-checker';

export class MemberPermissions {
  constructor(tenant, user) {
    const permissionChecker = new PermissionChecker(
      tenant,
      user,
    );

    this.read = permissionChecker.match(
      Permissions.values.memberRead,
    );
    this.import = permissionChecker.match(
      Permissions.values.memberImport,
    );
    this.memberAutocomplete = permissionChecker.match(
      Permissions.values.memberAutocomplete,
    );
    this.create = permissionChecker.match(
      Permissions.values.memberCreate,
    );
    this.edit = permissionChecker.match(
      Permissions.values.memberEdit,
    );
    this.destroy = permissionChecker.match(
      Permissions.values.memberDestroy,
    );
    this.lockedForCurrentPlan = permissionChecker.lockedForCurrentPlan(
      Permissions.values.memberRead,
    );
    this.createLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.memberCreate,
    );
    this.editLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.memberEdit,
    );
    this.destroyLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.memberDestroy,
    );
    this.mergeMembers = permissionChecker.match(
      Permissions.values.mergeMembers,
    );
  }
}
