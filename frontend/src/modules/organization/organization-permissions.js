import Permissions from '@/security/permissions'
import { PermissionChecker } from '@/modules/user/permission-checker'

export class OrganizationPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.read = permissionChecker.match(
      Permissions.values.organizationRead
    )
    this.import = permissionChecker.match(
      Permissions.values.organizationImport
    )
    this.organizationAutocomplete = permissionChecker.match(
      Permissions.values.organizationAutocomplete
    )
    this.create = permissionChecker.match(
      Permissions.values.organizationCreate
    )
    this.edit = permissionChecker.match(
      Permissions.values.organizationEdit
    )
    this.destroy = permissionChecker.match(
      Permissions.values.organizationDestroy
    )
    this.lockedForCurrentPlan =
      permissionChecker.lockedForCurrentPlan(
        Permissions.values.organizationRead
      )
  }
}
