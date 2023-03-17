import Permissions from '@/security/permissions'
import { PermissionChecker } from '@/modules/user/permission-checker'

export class TagPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.read = permissionChecker.match(
      Permissions.values.tagRead
    )
    this.import = permissionChecker.match(
      Permissions.values.tagImport
    )
    this.tagAutocomplete = permissionChecker.match(
      Permissions.values.tagAutocomplete
    )
    this.create = permissionChecker.match(
      Permissions.values.tagCreate
    )
    this.edit = permissionChecker.match(
      Permissions.values.tagEdit
    )
    this.destroy = permissionChecker.match(
      Permissions.values.tagDestroy
    )
    this.lockedForCurrentPlan =
      permissionChecker.lockedForCurrentPlan(
        Permissions.values.tagRead
      )
  }
}
