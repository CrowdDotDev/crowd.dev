import Permissions from '@/security/permissions'
import { PermissionChecker } from '@/modules/user/permission-checker'

export class MemberPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.read = permissionChecker.match(
      Permissions.values.memberRead
    )
    this.import = permissionChecker.match(
      Permissions.values.memberImport
    )
    this.memberAutocomplete = permissionChecker.match(
      Permissions.values.memberAutocomplete
    )
    this.create = permissionChecker.match(
      Permissions.values.memberCreate
    )
    this.edit = permissionChecker.match(
      Permissions.values.memberEdit
    )
    this.destroy = permissionChecker.match(
      Permissions.values.memberDestroy
    )
    this.lockedForCurrentPlan =
      permissionChecker.lockedForCurrentPlan(
        Permissions.values.memberRead
      )
  }
}
