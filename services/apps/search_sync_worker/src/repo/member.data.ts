export interface IMemberIdentityData {
  platform: string
  username: string
}

export interface IMemberTagData {
  id: string
  name: string
}

export interface IMemberOrganization {
  id: string
  logo: string | null
  displayName: string | null
}

export interface IMemberSyncData {
  id: string
  tenantId: string
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

  identities: IMemberIdentityData[]
  organizations: IMemberOrganization[]
  tags: IMemberTagData[]
  toMergeIds: string[]
  noMergeIds: string[]
}
