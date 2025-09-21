import { LoggerBase } from '@crowd/logging'
import { IMemberOrganization, MemberRoleUnmergeStrategy } from '@crowd/types'

import { IServiceOptions } from './IServiceOptions'

export default class MemberOrganizationService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  static roleExistsInArray(
    role: IMemberOrganization,
    roles: IMemberOrganization[],
    strategy: MemberRoleUnmergeStrategy,
  ): boolean {
    if (strategy === MemberRoleUnmergeStrategy.SAME_MEMBER) {
      return roles.some(
        (r) =>
          r.organizationId === role.organizationId &&
          r.title === role.title &&
          r.dateStart === role.dateStart &&
          r.dateEnd === role.dateEnd,
      )
    }

    return roles.some(
      (r) =>
        r.memberId === role.memberId &&
        r.title === role.title &&
        r.dateStart === role.dateStart &&
        r.dateEnd === role.dateEnd,
    )
  }

  static rolesIntersects(
    roleA: IMemberOrganization,
    roleB: IMemberOrganization,
    strategy: MemberRoleUnmergeStrategy,
  ): boolean {
    const startA = new Date(roleA.dateStart).getTime()
    const endA = new Date(roleA.dateEnd).getTime()
    const startB = new Date(roleB.dateStart).getTime()
    const endB = new Date(roleB.dateEnd).getTime()

    if (strategy === MemberRoleUnmergeStrategy.SAME_MEMBER) {
      return (
        (roleA.organizationId === roleB.organizationId &&
          roleA.title === roleB.title &&
          startA < startB &&
          endA > startB) ||
        (startB < startA && endB > startA) ||
        (startA < startB && endA > endB) ||
        (startB < startA && endB > endA)
      )
    }

    return (
      (roleA.memberId === roleB.memberId &&
        roleA.title === roleB.title &&
        startA < startB &&
        endA > startB) ||
      (startB < startA && endB > startA) ||
      (startA < startB && endA > endB) ||
      (startB < startA && endB > endA)
    )
  }

  /**
   * Unmerges secondaryBackupRoles from mergedRoles using backups
   * @param mergedRoles
   * @param primaryBackupRoles
   * @param secondaryBackupRoles
   * @returns unmerged roles for current member
   */
  static unmergeRoles(
    mergedRoles: IMemberOrganization[],
    primaryBackupRoles: IMemberOrganization[],
    secondaryBackupRoles: IMemberOrganization[],
    strategy: MemberRoleUnmergeStrategy,
  ): IMemberOrganization[] {
    // end result must contain existing roles that have source === UI
    // also we shouldn't touch roles that doesn't have a common organizationId (or memberId if the strategy is SAME_ORGANIZATION) with secondaryBackupRoles
    let unmergedRoles: IMemberOrganization[]
    // we should only manipulate roles that doesn't have source === UI because these were manually created/edited by user
    // and shared organization (or member roles if stragey is SAME_ORGANIZATION) roles with secondaryBackupRoles
    let editableRoles: IMemberOrganization[]

    if (strategy === MemberRoleUnmergeStrategy.SAME_MEMBER) {
      unmergedRoles = mergedRoles.filter(
        (role) =>
          role.source === 'ui' ||
          !secondaryBackupRoles.some((r) => r.organizationId === role.organizationId),
      )

      editableRoles = mergedRoles.filter(
        (role) =>
          role.source !== 'ui' &&
          secondaryBackupRoles.some((r) => r.organizationId === role.organizationId),
      )
    } else {
      unmergedRoles = mergedRoles.filter(
        (role) =>
          role.source === 'ui' || !secondaryBackupRoles.some((r) => r.memberId === role.memberId),
      )
      editableRoles = mergedRoles.filter(
        (role) =>
          role.source !== 'ui' && secondaryBackupRoles.some((r) => r.memberId === role.memberId),
      )
    }

    for (const secondaryBackupRole of secondaryBackupRoles) {
      if (secondaryBackupRole.dateStart === null && secondaryBackupRole.dateEnd === null) {
        if (
          MemberOrganizationService.roleExistsInArray(
            secondaryBackupRole,
            editableRoles,
            strategy,
          ) &&
          MemberOrganizationService.roleExistsInArray(
            secondaryBackupRole,
            primaryBackupRoles,
            strategy,
          )
        ) {
          // add it to unmergedRoles
          unmergedRoles.push(secondaryBackupRole)
        }
      } else if (secondaryBackupRole.dateStart !== null && secondaryBackupRole.dateEnd === null) {
        // it's a current role, add the current role found in primary backup to unmergedRoles, if primary backup doesn't have it we don't need to add it to unmergedRoles
        const currentRoleFromPrimaryBackup = primaryBackupRoles.find(
          (r) =>
            r.organizationId === secondaryBackupRole.organizationId &&
            r.title === secondaryBackupRole.title &&
            r.dateStart !== null &&
            r.dateEnd === null,
        )
        if (currentRoleFromPrimaryBackup) {
          unmergedRoles.push(currentRoleFromPrimaryBackup)
        }
      } else if (secondaryBackupRole.dateStart !== null && secondaryBackupRole.dateEnd !== null) {
        // if it exists both in primary backup and current member, add it
        if (
          MemberOrganizationService.roleExistsInArray(
            secondaryBackupRole,
            editableRoles,
            strategy,
          ) &&
          MemberOrganizationService.roleExistsInArray(
            secondaryBackupRole,
            primaryBackupRoles,
            strategy,
          )
        ) {
          // add it to unmergedRoles
          unmergedRoles.push(secondaryBackupRole)
        } else {
          // it could be a merged-role using both roles in primary & secondary
          // check if it intersects with any of the roles in editableRoles
          const intersectingRoleInCurrentMember = editableRoles.find((r) =>
            MemberOrganizationService.rolesIntersects(secondaryBackupRole, r, strategy),
          )

          if (intersectingRoleInCurrentMember) {
            // find intersecting role in primary backup, and add it to unmergedRoles
            const intersectingRoleInPrimaryBackup = primaryBackupRoles.find((r) =>
              MemberOrganizationService.rolesIntersects(secondaryBackupRole, r, strategy),
            )

            if (intersectingRoleInPrimaryBackup) {
              unmergedRoles.push(intersectingRoleInPrimaryBackup)
            }
          }
        }
      }
    }

    return unmergedRoles
  }
}
