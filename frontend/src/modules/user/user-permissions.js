import { PermissionChecker } from '@/modules/user/permission-checker'
import Permissions from '@/security/permissions'

export class UserPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.read = permissionChecker.match(
      Permissions.values.userRead
    )
    this.import = permissionChecker.match(
      Permissions.values.userImport
    )
    this.userAutocomplete = permissionChecker.match(
      Permissions.values.userAutocomplete
    )
    this.create = permissionChecker.match(
      Permissions.values.userCreate
    )
    this.edit = permissionChecker.match(
      Permissions.values.userEdit
    )
    this.destroy = permissionChecker.match(
      Permissions.values.userDestroy
    )
    this.lockedForCurrentPlan =
      permissionChecker.lockedForCurrentPlan(
        Permissions.values.userRead
      )
  }
}
