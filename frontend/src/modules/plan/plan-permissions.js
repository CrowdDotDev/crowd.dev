import { PermissionChecker } from '@/premium/user/permission-checker'
import Permissions from '@/security/permissions'

export class PlanPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.read = permissionChecker.match(
      Permissions.values.planRead
    )

    this.edit = permissionChecker.match(
      Permissions.values.planEdit
    )

    this.lockedForCurrentPlan = permissionChecker.lockedForCurrentPlan(
      Permissions.values.planRead
    )
  }
}
