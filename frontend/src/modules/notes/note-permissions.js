import Permissions from '@/security/permissions'
import { PermissionChecker } from '@/modules/user/permission-checker'

export class NotePermissions {
  constructor(currentTenant, currentUser) {
    const permissionChecker = new PermissionChecker(
      currentTenant,
      currentUser
    )

    this.createLockedForSampleData =
      permissionChecker.lockedForSampleData(
        Permissions.values.noteCreate
      )
    this.editLockedForSampleData =
      permissionChecker.lockedForSampleData(
        Permissions.values.noteEdit
      )
    this.destroyLockedForSampleData =
      permissionChecker.lockedForSampleData(
        Permissions.values.noteDestroy
      )
  }
}
