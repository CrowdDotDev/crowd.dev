import { uniq } from 'lodash'

import { SegmentData } from '@crowd/types'

import { LfxMembership, findManyLfxMemberships } from '../lfx_memberships'
import { OrganizationField, queryOrgs } from '../organizations'
import { QueryExecutor } from '../queryExecutor'
import { fetchManySegments } from '../segments'

interface MemberOrganization {
  id: string
  organizationId: string
  dateStart?: string
  dateEnd?: string
  affiliationOverride?: {
    isPrimaryWorkExperience?: boolean
  }
}

interface MemberOrganizationData {
  memberId: string
  organizations: MemberOrganization[]
}

interface OrganizationInfo {
  id: string
  displayName: string
  logo: string
  createdAt: string
}

interface MemberSegmentData {
  memberId: string
  segments: Array<{
    segmentId: string
    activityCount: number
  }>
}

export const sortActiveOrganizations = (
  activeOrgs: MemberOrganization[],
  organizationsInfo: OrganizationInfo[],
): MemberOrganization[] => {
  return activeOrgs.sort((a, b) => {
    if (!a || !b) return 0

    // First priority: isPrimaryWorkExperience
    const aPrimary = a.affiliationOverride?.isPrimaryWorkExperience === true
    const bPrimary = b.affiliationOverride?.isPrimaryWorkExperience === true

    if (aPrimary !== bPrimary) return aPrimary ? -1 : 1

    // Second priority: has dateStart
    const aHasDate = !!a.dateStart
    const bHasDate = !!b.dateStart

    if (aHasDate !== bHasDate) return aHasDate ? -1 : 1

    // Third priority: createdAt and alphabetical
    if (!a.dateStart && !b.dateStart) {
      const aOrgInfo = organizationsInfo.find((odn) => odn.id === a.organizationId)
      const bOrgInfo = organizationsInfo.find((odn) => odn.id === b.organizationId)

      const aCreatedAt = aOrgInfo?.createdAt ? new Date(aOrgInfo.createdAt).getTime() : 0
      const bCreatedAt = bOrgInfo?.createdAt ? new Date(bOrgInfo.createdAt).getTime() : 0

      if (aCreatedAt !== bCreatedAt) return bCreatedAt - aCreatedAt

      const aName = (aOrgInfo?.displayName || '').toLowerCase()
      const bName = (bOrgInfo?.displayName || '').toLowerCase()
      return aName.localeCompare(bName)
    }

    return 0
  })
}

export const fetchOrganizationData = async (
  qx: QueryExecutor,
  memberOrganizations: MemberOrganizationData[],
): Promise<{ orgs: OrganizationInfo[]; lfx: LfxMembership[] }> => {
  if (memberOrganizations.length === 0) {
    return { orgs: [], lfx: [] }
  }

  const orgIds = uniq(
    memberOrganizations.reduce((acc, mo) => {
      acc.push(...mo.organizations.map((o) => o.organizationId))
      return acc
    }, []),
  )

  if (orgIds.length === 0) {
    return { orgs: [], lfx: [] }
  }

  const [orgs, lfx] = await Promise.all([
    queryOrgs(qx, {
      filter: { [OrganizationField.ID]: { in: orgIds } },
      fields: [
        OrganizationField.ID,
        OrganizationField.DISPLAY_NAME,
        OrganizationField.LOGO,
        OrganizationField.CREATED_AT,
      ],
    }),
    findManyLfxMemberships(qx, { organizationIds: orgIds }),
  ])

  return { orgs, lfx }
}

export const fetchSegmentData = async (
  qx: QueryExecutor,
  memberSegments: MemberSegmentData[],
): Promise<SegmentData[]> => {
  if (memberSegments.length === 0) {
    return []
  }

  const segmentIds = uniq(
    memberSegments.reduce((acc, ms) => {
      acc.push(...ms.segments.map((s) => s.segmentId))
      return acc
    }, []),
  )

  return segmentIds.length > 0 ? fetchManySegments(qx, segmentIds) : []
}
