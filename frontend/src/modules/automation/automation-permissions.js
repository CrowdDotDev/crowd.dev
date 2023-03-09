import Permissions from '@/security/permissions'
import { PermissionChecker } from '@/modules/user/permission-checker'

export class AutomationPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.read = permissionChecker.match(
      Permissions.values.automationRead
    )
    this.import = permissionChecker.match(
      Permissions.values.automationImport
    )
    this.automationAutocomplete = permissionChecker.match(
      Permissions.values.automationAutocomplete
    )
    this.create = permissionChecker.match(
      Permissions.values.automationCreate
    )
    this.edit = permissionChecker.match(
      Permissions.values.automationEdit
    )
    this.destroy = permissionChecker.match(
      Permissions.values.automationDestroy
    )
    this.lockedForCurrentPlan =
      permissionChecker.lockedForCurrentPlan(
        Permissions.values.automationRead
      )
    this.customize = permissionChecker.match(
      Permissions.values.automationCustomize
    )
  }
}
