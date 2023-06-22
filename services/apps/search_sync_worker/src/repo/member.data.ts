export interface IDbMemberIdentityData {
  platform: string
  username: string
}

export interface IDbMemberTagData {
  id: string
  name: string
}

export interface IDbMemberOrganization {
  id: string
  logo: string | null
  displayName: string | null
}

export interface IDbMemberSyncData {
  id: string
  tenantId: string
  segmentId: string
  displayName: string | null
  attributes: unknown | null
  emails: string[] | null
  score: number | null
  lastEnriched: string | null
  joinedAt: string
  totalReach: number
  numberOfOpenSourceContributions: number

  // member activity data
  activeOn: string[]
  activityCount: number
  activityTypes: string[]
  activeDaysCount: number
  lastActive: string
  averageSentiment: number | null

  identities: IDbMemberIdentityData[]
  organizations: IDbMemberOrganization[]
  tags: IDbMemberTagData[]
  toMergeIds: string[]
  noMergeIds: string[]
}

export interface IDbSegmentInfo {
  id: string
  parentId: string
  grandParentId: string
}
