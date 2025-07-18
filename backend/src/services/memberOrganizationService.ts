import {
  changeOverride,
  deleteAffiliationOverrides,
  findOverrides,
} from '@crowd/data-access-layer/src/member_organization_affiliation_overrides'
import { LoggerBase } from '@crowd/logging'
import { IMemberOrganization, MemberRoleUnmergeStrategy } from '@crowd/types'

import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import MemberOrganizationRepository, {
  EntityField,
} from '../database/repositories/memberOrganizationRepository'

import { IServiceOptions } from './IServiceOptions'

interface IMergeStrat {
  entityIdField: EntityField
  intersectBasedOnField: EntityField
  entityId(a: IMemberOrganization): string
  intersectBasedOn(a: IMemberOrganization): string
  worthMerging(a: IMemberOrganization, b: IMemberOrganization): boolean
  targetMemberId(role: IMemberOrganization): string
  targetOrganizationId(role: IMemberOrganization): string
}

const MemberMergeStrat = (primaryMemberId: string): IMergeStrat => ({
  entityIdField: EntityField.memberId,
  intersectBasedOnField: EntityField.organizationId,
  entityId(role: IMemberOrganization): string {
    return role.memberId
  },
  intersectBasedOn(role: IMemberOrganization): string {
    return role.organizationId
  },
  worthMerging(a: IMemberOrganization, b: IMemberOrganization): boolean {
    return a.memberId === b.memberId
  },
  targetMemberId(): string {
    return primaryMemberId
  },
  targetOrganizationId(role: IMemberOrganization): string {
    return role.organizationId
  },
})

const OrgMergeStrat = (primaryOrganizationId: string): IMergeStrat => ({
  entityIdField: EntityField.organizationId,
  intersectBasedOnField: EntityField.memberId,
  entityId(role: IMemberOrganization): string {
    return role.organizationId
  },
  intersectBasedOn(role: IMemberOrganization): string {
    return role.memberId
  },
  worthMerging(a: IMemberOrganization, b: IMemberOrganization): boolean {
    return a.organizationId === b.organizationId
  },
  targetMemberId(role: IMemberOrganization): string {
    return role.memberId
  },
  targetOrganizationId(): string {
    return primaryOrganizationId
  },
})

export default class MemberOrganizationService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async moveMembersBetweenOrganizations(
    secondaryOrganizationId: string,
    primaryOrganizationId: string,
  ): Promise<void> {
    await this.moveRolesBetweenEntities(
      primaryOrganizationId,
      secondaryOrganizationId,
      OrgMergeStrat(primaryOrganizationId),
    )
  }

  async moveOrgsBetweenMembers(primaryMemberId: string, secondaryMemberId: string): Promise<void> {
    await this.moveRolesBetweenEntities(
      primaryMemberId,
      secondaryMemberId,
      MemberMergeStrat(primaryMemberId),
    )
  }

  async moveRolesBetweenEntities(primaryId: string, secondaryId: string, mergeStrat: IMergeStrat) {
    // first, handle members that belong to both organizations,
    // then make a full update on remaining org2 members (that doesn't belong to o1)
    const rolesForBothEntities =
      await MemberOrganizationRepository.findRolesBelongingToBothEntities(
        primaryId,
        secondaryId,
        mergeStrat.entityIdField,
        mergeStrat.intersectBasedOnField,
        this.options,
      )

    const primaryRoles = rolesForBothEntities.filter((m) => mergeStrat.entityId(m) === primaryId)
    const secondaryRoles = rolesForBothEntities.filter(
      (m) => mergeStrat.entityId(m) === secondaryId,
    )

    await this.mergeRoles(primaryRoles, secondaryRoles, mergeStrat)

    // update rest of the o2 members
    const remainingRoles = await MemberOrganizationRepository.findNonIntersectingRoles(
      primaryId,
      secondaryId,
      mergeStrat.entityIdField,
      mergeStrat.intersectBasedOnField,
      this.options,
    )

    const qx = SequelizeRepository.getQueryExecutor(this.options)

    for (const role of remainingRoles) {
      // delete any existing affiliation override for the role to avoid foreign key conflicts
      // and reapply it with the new memberOrganizationId
      const [existingOverride] = await findOverrides(qx, role.memberId, [role.id])
      if (existingOverride) {
        await deleteAffiliationOverrides(qx, role.memberId, [role.id])
      }

      await MemberOrganizationRepository.removeMemberRole(role, this.options)
      const newRoleId = await MemberOrganizationRepository.addMemberRole(
        {
          title: role.title,
          dateStart: role.dateStart,
          dateEnd: role.dateEnd,
          memberId: mergeStrat.targetMemberId(role),
          organizationId: mergeStrat.targetOrganizationId(role),
          source: role.source,
          deletedAt: role.deletedAt,
        },
        this.options,
      )

      if (existingOverride) {
        await changeOverride(qx, {
          ...existingOverride,
          memberId: mergeStrat.targetMemberId(role),
          memberOrganizationId: newRoleId,
        })
      }
    }
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

  async mergeRoles(
    primaryRoles: IMemberOrganization[],
    secondaryRoles: IMemberOrganization[],
    mergeStrat: IMergeStrat,
  ) {
    let removeRoles: IMemberOrganization[] = []
    let addRoles: IMemberOrganization[] = []

    for (const memberOrganization of secondaryRoles) {
      // if dateEnd and dateStart isn't available, we don't need to move but delete it from org2
      if (memberOrganization.dateStart === null && memberOrganization.dateEnd === null) {
        removeRoles.push(memberOrganization)
      }
      // it's a current role, also check org1 to see which one starts earlier
      else if (memberOrganization.dateStart !== null && memberOrganization.dateEnd === null) {
        const currentRoles = primaryRoles.filter(
          (mo) =>
            mergeStrat.worthMerging(mo, memberOrganization) &&
            mo.dateStart !== null &&
            mo.dateEnd === null,
        )
        if (currentRoles.length === 0) {
          // no current role in org1, add the memberOrganization to org1
          addRoles.push(memberOrganization)
        } else if (currentRoles.length === 1) {
          const currentRole = currentRoles[0]
          if (new Date(memberOrganization.dateStart) <= new Date(currentRoles[0].dateStart)) {
            // add a new role with earlier dateStart
            addRoles.push({
              id: currentRole.id,
              dateStart: (memberOrganization.dateStart as Date).toISOString(),
              dateEnd: null,
              memberId: currentRole.memberId,
              organizationId: currentRole.organizationId,
              title: currentRole.title,
              source: currentRole.source,
            })

            // remove current role
            removeRoles.push(currentRole)
          }

          // delete role from org2
          removeRoles.push(memberOrganization)
        } else {
          throw new Error(`Member ${memberOrganization.memberId} has more than one current roles.`)
        }
      } else if (memberOrganization.dateStart === null && memberOrganization.dateEnd !== null) {
        throw new Error(`Member organization with dateEnd and without dateStart!`)
      } else {
        // both dateStart and dateEnd exists
        const foundIntersectingRoles = primaryRoles.filter((mo) => {
          const primaryStart = new Date(mo.dateStart)
          const primaryEnd = new Date(mo.dateEnd)
          const secondaryStart = new Date(memberOrganization.dateStart)
          const secondaryEnd = new Date(memberOrganization.dateEnd)

          return (
            mo.memberId === memberOrganization.memberId &&
            mo.dateStart !== null &&
            mo.dateEnd !== null &&
            ((secondaryStart < primaryStart && secondaryEnd > primaryStart) ||
              (primaryStart < secondaryStart && secondaryEnd < primaryEnd) ||
              (secondaryStart < primaryStart && secondaryEnd > primaryEnd) ||
              (primaryStart < secondaryStart && secondaryEnd > primaryEnd))
          )
        })

        // rebuild dateRanges using intersecting roles coming from primary and secondary organizations
        const startDates = [...foundIntersectingRoles, memberOrganization].map((org) =>
          new Date(org.dateStart).getTime(),
        )
        const endDates = [...foundIntersectingRoles, memberOrganization].map((org) =>
          new Date(org.dateEnd).getTime(),
        )

        addRoles.push({
          dateStart: new Date(Math.min.apply(null, startDates)).toISOString(),
          dateEnd: new Date(Math.max.apply(null, endDates)).toISOString(),
          memberId: mergeStrat.targetMemberId(memberOrganization),
          organizationId: mergeStrat.targetOrganizationId(memberOrganization),
          title:
            foundIntersectingRoles.length > 0
              ? foundIntersectingRoles[0].title
              : memberOrganization.title,
          source:
            foundIntersectingRoles.length > 0
              ? foundIntersectingRoles[0].source
              : memberOrganization.source,
        })

        // we'll delete all roles that intersect with incoming org member roles and create a merged role
        for (const r of foundIntersectingRoles) {
          removeRoles.push(r)
        }
      }

      const qx = SequelizeRepository.getQueryExecutor(this.options)

      for (const removeRole of removeRoles) {
        // delete affiliation overrides before removing roles to avoid foreign key conflicts
        const [existingOverride] = await findOverrides(qx, removeRole.memberId, [removeRole.id])
        if (existingOverride) {
          await deleteAffiliationOverrides(qx, removeRole.memberId, [removeRole.id])
        }
        await MemberOrganizationRepository.removeMemberRole(removeRole, this.options)
      }

      for (const addRole of addRoles) {
        await MemberOrganizationRepository.addMemberRole(addRole, this.options)
      }

      addRoles = []
      removeRoles = []
    }
  }
}
