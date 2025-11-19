import { groupBy, uniq } from 'lodash'

import { SegmentType } from '@crowd/types'

import { findMaintainerRoles } from '../maintainers'
import { QueryExecutor } from '../queryExecutor'
import { fetchManySegments } from '../segments'

import {
  MemberOrganizationData,
  OrganizationInfo,
  fetchOrganizationData,
  fetchSegmentData,
  sortActiveOrganizations,
} from './dataProcessor'
import { IDbMemberData } from './types'

import { fetchManyMemberIdentities, fetchManyMemberOrgs, fetchManyMemberSegments } from '.'

export interface IncludeOptions {
  identities?: boolean
  segments?: boolean
  memberOrganizations?: boolean
  onlySubProjects?: boolean
  maintainers?: boolean
}

interface OrganizationExtra {
  orgs: OrganizationInfo[]
  lfx: Array<{
    organizationId: string
    [key: string]: unknown
  }>
}

interface MemberSegment {
  memberId: string
  segments: Array<{
    segmentId: string
    activityCount: number
    [key: string]: unknown
  }>
}

interface SegmentInfo {
  id: string
  name?: string
  type?: SegmentType
  [key: string]: unknown
}

interface MaintainerRole {
  memberId: string
  segmentId: string
  [key: string]: unknown
}

interface MemberIdentityData {
  memberId: string
  identities: Array<{
    type: string
    value: string
    platform: string
    verified: boolean
  }>
}

export class MemberDetailsCompletion {
  constructor(private qx: QueryExecutor) {}

  async complete(rows: IDbMemberData[], include: IncludeOptions): Promise<void> {
    if (rows.length === 0) return

    const memberIds = rows.map((row) => row.id)

    // Fetch all related data in parallel
    const [memberOrganizations, identities, memberSegments, maintainerRoles] = await Promise.all([
      include.memberOrganizations ? fetchManyMemberOrgs(this.qx, memberIds) : Promise.resolve([]),
      include.identities ? fetchManyMemberIdentities(this.qx, memberIds) : Promise.resolve([]),
      include.segments ? fetchManyMemberSegments(this.qx, memberIds) : Promise.resolve([]),
      include.maintainers ? findMaintainerRoles(this.qx, memberIds) : Promise.resolve([]),
    ])

    // Fetch additional metadata in parallel
    const [orgExtra, segmentsInfo, maintainerSegmentsInfo] = await Promise.all([
      include.memberOrganizations
        ? fetchOrganizationData(this.qx, memberOrganizations)
        : Promise.resolve({ orgs: [], lfx: [] }),
      include.segments ? fetchSegmentData(this.qx, memberSegments) : Promise.resolve([]),
      include.maintainers && maintainerRoles.length > 0
        ? fetchManySegments(this.qx, uniq(maintainerRoles.map((m) => m.segmentId)))
        : Promise.resolve([]),
    ])

    // Complete each member with their detailed data
    await Promise.all([
      this.completeOrganizations(rows, memberOrganizations, orgExtra, include),
      this.completeSegments(rows, memberSegments, segmentsInfo, include),
      this.completeMaintainerRoles(rows, maintainerRoles, maintainerSegmentsInfo, include),
      this.completeIdentities(rows, identities, include),
    ])
  }

  private async completeOrganizations(
    rows: IDbMemberData[],
    memberOrganizations: MemberOrganizationData[],
    orgExtra: OrganizationExtra,
    include: IncludeOptions,
  ): Promise<void> {
    if (!include.memberOrganizations) return

    const { orgs = [], lfx = [] } = orgExtra

    for (const member of rows) {
      member.organizations = []
      const memberOrgs =
        memberOrganizations.find((o) => o.memberId === member.id)?.organizations || []
      const activeOrgs = memberOrgs.filter((org) => !org.dateEnd)
      const sortedActiveOrgs = sortActiveOrganizations(activeOrgs, orgs)
      const activeOrg = sortedActiveOrgs[0]

      if (activeOrg) {
        const orgInfo = orgs.find((odn) => odn.id === activeOrg.organizationId)
        if (orgInfo) {
          const lfxMembership = lfx.find((m) => m.organizationId === activeOrg.organizationId)
          member.organizations = [
            {
              id: activeOrg.organizationId,
              displayName: orgInfo.displayName || '',
              logo: orgInfo.logo || '',
              lfxMembership: !!lfxMembership,
            },
          ]
        }
      }
    }
  }

  private async completeSegments(
    rows: IDbMemberData[],
    memberSegments: MemberSegment[],
    segmentsInfo: SegmentInfo[],
    include: IncludeOptions,
  ): Promise<void> {
    if (!include.segments) return

    rows.forEach((member) => {
      member.segments = (memberSegments.find((i) => i.memberId === member.id)?.segments || [])
        .map((segment) => {
          const segmentInfo = segmentsInfo.find((s) => s.id === segment.segmentId)

          if (include.onlySubProjects && segmentInfo?.type !== SegmentType.SUB_PROJECT) {
            return null
          }

          return {
            id: segment.segmentId,
            name: segmentInfo?.name,
            activityCount: segment.activityCount,
          }
        })
        .filter(Boolean)
    })
  }

  private async completeMaintainerRoles(
    rows: IDbMemberData[],
    maintainerRoles: MaintainerRole[],
    maintainerSegmentsInfo: SegmentInfo[],
    include: IncludeOptions,
  ): Promise<void> {
    if (!include.maintainers) return

    const groupedMaintainers = groupBy(maintainerRoles, (m) => m.memberId)

    rows.forEach((member) => {
      member.maintainerRoles = (groupedMaintainers[member.id] || []).map((role) => {
        const segmentInfo = maintainerSegmentsInfo.find((s) => s.id === role.segmentId)
        return {
          ...role,
          segmentName: segmentInfo?.name,
        }
      })
    })
  }

  private async completeIdentities(
    rows: IDbMemberData[],
    identities: MemberIdentityData[],
    include: IncludeOptions,
  ): Promise<void> {
    if (!include.identities) return

    rows.forEach((member) => {
      const memberIdentities = identities.find((i) => i.memberId === member.id)?.identities || []
      member.identities = memberIdentities.map((identity) => ({
        type: identity.type,
        value: identity.value,
        platform: identity.platform,
        verified: identity.verified,
      }))
    })
  }
}
