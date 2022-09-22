import { PermissionChecker } from '@/premium/user/permission-checker'
import Permissions from '@/security/permissions'

export class AuditLogPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.read = permissionChecker.match(
      Permissions.values.auditLogRead
    )
    this.lockedForCurrentPlan =
      permissionChecker.lockedForCurrentPlan(
        Permissions.values.auditLogRead
      )
  }
}
