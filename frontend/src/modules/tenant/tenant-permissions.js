import Permissions from '@/security/permissions'
import { PermissionChecker } from '@/modules/user/permission-checker'

export class TenantPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.create = true
    this.edit = permissionChecker.match(
      Permissions.values.tenantEdit
    )
    this.destroy = permissionChecker.match(
      Permissions.values.tenantDestroy
    )
  }
}
