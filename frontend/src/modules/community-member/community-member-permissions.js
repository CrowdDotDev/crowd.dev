import Permissions from '@/security/permissions'
import { PermissionChecker } from '@/premium/user/permission-checker'

export class CommunityMemberPermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.read = permissionChecker.match(
      Permissions.values.communityMemberRead
    )
    this.import = permissionChecker.match(
      Permissions.values.communityMemberImport
    )
    this.communityMemberAutocomplete =
      permissionChecker.match(
        Permissions.values.communityMemberAutocomplete
      )
    this.create = permissionChecker.match(
      Permissions.values.communityMemberCreate
    )
    this.edit = permissionChecker.match(
      Permissions.values.communityMemberEdit
    )
    this.destroy = permissionChecker.match(
      Permissions.values.communityMemberDestroy
    )
    this.lockedForCurrentPlan =
      permissionChecker.lockedForCurrentPlan(
        Permissions.values.communityMemberRead
      )
  }
}
