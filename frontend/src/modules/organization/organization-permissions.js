import Permissions from '@/security/permissions';
import { PermissionChecker } from '@/modules/user/permission-checker';

export class OrganizationPermissions {
  constructor(tenant, user) {
    const permissionChecker = new PermissionChecker(
      tenant,
      user,
    );

    this.read = permissionChecker.match(
      Permissions.values.organizationRead,
    );
    this.import = permissionChecker.match(
      Permissions.values.organizationImport,
    );
    this.organizationAutocomplete = permissionChecker.match(
      Permissions.values.organizationAutocomplete,
    );
    this.create = permissionChecker.match(
      Permissions.values.organizationCreate,
    );
    this.edit = permissionChecker.match(
      Permissions.values.organizationEdit,
    );
    this.destroy = permissionChecker.match(
      Permissions.values.organizationDestroy,
    );
    this.lockedForCurrentPlan = permissionChecker.lockedForCurrentPlan(
      Permissions.values.organizationRead,
    );
    this.createLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.organizationCreate,
    );
    this.editLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.organizationEdit,
    );
    this.destroyLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.organizationDestroy,
    );
    this.mergeOrganizations = permissionChecker.match(
      Permissions.values.mergeOrganizations,
    );
  }
}
