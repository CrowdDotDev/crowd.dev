import Permissions from '@/security/permissions';
import { PermissionChecker } from '@/modules/user/permission-checker';

export class NotePermissions {
  constructor(tenant, user) {
    const permissionChecker = new PermissionChecker(
      tenant,
      user,
    );

    this.createLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.noteCreate,
    );
    this.editLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.noteEdit,
    );
    this.destroyLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.noteDestroy,
    );
  }
}
