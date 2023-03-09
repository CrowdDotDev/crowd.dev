import Permissions from '@/security/permissions'
import { PermissionChecker } from '@/modules/user/permission-checker'

export class TaskPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.read = permissionChecker.match(
      Permissions.values.taskRead
    )
    this.import = permissionChecker.match(
      Permissions.values.taskImport
    )
    this.taskAutocomplete = permissionChecker.match(
      Permissions.values.taskAutocomplete
    )
    this.create = permissionChecker.match(
      Permissions.values.taskCreate
    )
    this.edit = permissionChecker.match(
      Permissions.values.taskEdit
    )
    this.destroy = permissionChecker.match(
      Permissions.values.taskDestroy
    )
    this.lockedForCurrentPlan =
      permissionChecker.lockedForCurrentPlan(
        Permissions.values.taskRead
      )
  }
}
