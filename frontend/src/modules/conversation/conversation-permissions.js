import Permissions from '@/security/permissions';
import { PermissionChecker } from '@/modules/user/permission-checker';

export class ConversationPermissions {
  constructor(tenant, user) {
    const permissionChecker = new PermissionChecker(
      tenant,
      user,
    );

    this.read = permissionChecker.match(
      Permissions.values.conversationRead,
    );
    this.import = permissionChecker.match(
      Permissions.values.conversationImport,
    );
    this.conversationAutocomplete = permissionChecker.match(
      Permissions.values.conversationAutocomplete,
    );
    this.create = permissionChecker.match(
      Permissions.values.conversationCreate,
    );
    this.edit = permissionChecker.match(
      Permissions.values.conversationEdit,
    );
    this.destroy = permissionChecker.match(
      Permissions.values.conversationDestroy,
    );
    this.lockedForCurrentPlan = permissionChecker.lockedForCurrentPlan(
      Permissions.values.conversationRead,
    );
    this.customize = permissionChecker.match(
      Permissions.values.conversationCustomize,
    );
    this.createLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.conversationCreate,
    );
    this.editLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.conversationEdit,
    );
    this.destroyLockedForSampleData = permissionChecker.lockedForSampleData(
      Permissions.values.conversationDestroy,
    );
  }
}
