import { IMemberSegmentAggregates } from '@crowd/data-access-layer/src/members/types'
import { MemberIdentityType } from '@crowd/types'

export interface IDbMemberIdentityData {
  platform: string
  value: string
  type: MemberIdentityType
  verified: boolean
  sourceId: string | null
  integrationId: string | null
}

export interface IDbMemberTagData {
  id: string
  name: string
}

export interface IDbMemberNoteData {
  id: string
  body: string
}

export interface IDbMemberTaskData {
  id: string
  name: string
  body: string
  status: string
  dueDate: string
  type: string
}

export interface IDbMemberOrganization {
  id: string
  logo: string | null
  displayName: string | null
  memberOrganizations: {
    title: string
    dateStart: string
    dateEnd: string
    source?: string
  }
}

export interface IDbMemberAffiliationData {
  id: string
  segmentId: string
  segmentSlug: string
  segmentName: string
  segmentParentName: string
  organizationId: string
  organizationName: string
  organizationLogo: string
  dateStart: string
  dateEnd: string
}

export interface IDbMemberContributionData {
  id: string
  url: string
  topics: string[] | null
  summary: string | null
  numberCommits: number
  lastCommitDate: string
  firstCommitDate: string
}

export interface IDbMemberSyncData {
  id: string
  tenantId: string
  grandParentSegment: boolean
  displayName: string | null
  attributes: unknown | null
  score: number | null
  joinedAt: string
  createdAt: string
  manuallyCreated: boolean
  reach: unknown | null
  numberOfOpenSourceContributions: number

  contributions: IDbMemberContributionData[]
  affiliations: IDbMemberAffiliationData[]
  identities: IDbMemberIdentityData[]
  organizations: IDbMemberOrganization[]
  tags: IDbMemberTagData[]
  toMergeIds: string[]
  noMergeIds: string[]
  notes: IDbMemberNoteData[]
  tasks: IDbMemberTaskData[]
}

export interface IMemberSegmentMatrixItem {
  segmentId: string
  processed: boolean
  data: IDbMemberSyncData
  aggregates: IMemberSegmentAggregates
}

export interface IMemberSegmentMatrix {
  [key: string]: IMemberSegmentMatrixItem[]
}

export interface IMemberIdData {
  memberId: string
  manuallyCreated: boolean
}
