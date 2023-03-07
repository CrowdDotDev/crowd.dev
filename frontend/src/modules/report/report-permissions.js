import Permissions from '@/security/permissions'
import { PermissionChecker } from '@/modules/user/permission-checker'

export class ReportPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.read = permissionChecker.match(
      Permissions.values.reportRead
    )
    this.import = permissionChecker.match(
      Permissions.values.reportImport
    )
    this.reportAutocomplete = permissionChecker.match(
      Permissions.values.reportAutocomplete
    )
    this.create = permissionChecker.match(
      Permissions.values.reportCreate
    )
    this.edit = permissionChecker.match(
      Permissions.values.reportEdit
    )
    this.destroy = permissionChecker.match(
      Permissions.values.reportDestroy
    )
    this.lockedForCurrentPlan =
      permissionChecker.lockedForCurrentPlan(
        Permissions.values.reportRead
      )
  }
}
