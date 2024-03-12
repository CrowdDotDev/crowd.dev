import Permissions from '@/security/permissions';
import { PermissionChecker } from '@/modules/user/permission-checker';

export class LfPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser,
    );

    this.createProjectGroup = permissionChecker.match(
      Permissions.values.projectGroupCreate,
    );
    this.editProjectGroup = permissionChecker.match(
      Permissions.values.projectGroupEdit,
    );
    this.createProject = permissionChecker.match(
      Permissions.values.projectCreate,
    );
    this.editProject = permissionChecker.match(
      Permissions.values.projectEdit,
    );
    this.createSubProject = permissionChecker.match(
      Permissions.values.subProjectCreate,
    );
    this.editSubProject = permissionChecker.match(
      Permissions.values.subProjectEdit,
    );
  }
}
