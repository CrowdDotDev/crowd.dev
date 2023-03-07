import Permissions from '@/security/permissions'
import { PermissionChecker } from '@/modules/user/permission-checker'

export class ActivityPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.read = permissionChecker.match(
      Permissions.values.activityRead
    )
    this.import = permissionChecker.match(
      Permissions.values.activityImport
    )
    this.activityAutocomplete = permissionChecker.match(
      Permissions.values.activityAutocomplete
    )
    this.create = permissionChecker.match(
      Permissions.values.activityCreate
    )
    this.edit = permissionChecker.match(
      Permissions.values.activityEdit
    )
    this.destroy = permissionChecker.match(
      Permissions.values.activityDestroy
    )
    this.lockedForCurrentPlan =
      permissionChecker.lockedForCurrentPlan(
        Permissions.values.activityRead
      )
  }
}
