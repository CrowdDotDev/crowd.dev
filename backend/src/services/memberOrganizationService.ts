import { LoggerBase } from '@crowd/logging'
import { IMemberOrganization } from '@crowd/types'
import { IServiceOptions } from './IServiceOptions'
import MemberOrganizationRepository from '../database/repositories/memberOrganizationRepository'

export default class MemberOrganizationService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async moveMembersBetweenOrganizations(
    fromOrganizationId: string,
    toOrganizationId: string,
  ): Promise<void> {
    let removeRoles: IMemberOrganization[] = []

    let addRoles: IMemberOrganization[] = []

    // first, handle members that belong to both organizations,
    // then make a full update on remaining org2 members (that doesn't belong to o1)
    const memberRolesWithBothOrganizations =
      await MemberOrganizationRepository.findMembersBelongToBothOrganizations(
        fromOrganizationId,
        toOrganizationId,
        this.options,
      )

    const primaryOrganizationMemberRoles = memberRolesWithBothOrganizations.filter(
      (m) => m.organizationId === toOrganizationId,
    )
    const secondaryOrganizationMemberRoles = memberRolesWithBothOrganizations.filter(
      (m) => m.organizationId === fromOrganizationId,
    )

    for (const memberOrganization of secondaryOrganizationMemberRoles) {
      // if dateEnd and dateStart isn't available, we don't need to move but delete it from org2
      if (memberOrganization.dateStart === null && memberOrganization.dateEnd === null) {
        removeRoles.push(memberOrganization)
      }
      // it's a current role, also check org1 to see which one starts earlier
      else if (memberOrganization.dateStart !== null && memberOrganization.dateEnd === null) {
        const currentRoles = primaryOrganizationMemberRoles.filter(
          (mo) =>
            mo.memberId === memberOrganization.memberId &&
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
        const foundIntersectingRoles = primaryOrganizationMemberRoles.filter((mo) => {
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
          memberId: memberOrganization.memberId,
          organizationId: toOrganizationId,
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

      for (const removeRole of removeRoles) {
        await MemberOrganizationRepository.removeMemberRole(removeRole, this.options)
      }

      for (const addRole of addRoles) {
        await MemberOrganizationRepository.addMemberRole(addRole, this.options)
      }

      addRoles = []
      removeRoles = []
    }

    // update rest of the o2 members
    const remainingRoles = await MemberOrganizationRepository.fetchRemainingRoles(
      fromOrganizationId,
      toOrganizationId,
      this.options,
    )

    for (const role of remainingRoles) {
      await MemberOrganizationRepository.removeMemberRole(role, this.options)
      await MemberOrganizationRepository.addMemberRole(
        {
          title: role.title,
          dateStart: role.dateStart,
          dateEnd: role.dateEnd,
          memberId: role.memberId,
          organizationId: toOrganizationId,
          source: role.source,
          deletedAt: role.deletedAt,
        },
        this.options,
      )
    }
  }
}
