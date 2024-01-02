export interface IDbMemberIdentityData {
  platform: string
  username: string
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
  segmentId: string
  displayName: string | null
  attributes: unknown | null
  emails: string[] | null
  score: number | null
  lastEnriched: string | null
  joinedAt: string
  createdAt: string
  manuallyCreated: boolean
  reach: unknown | null
  numberOfOpenSourceContributions: number

  // member activity data
  activeOn: string[]
  activityCount: number
  activityTypes: string[]
  activeDaysCount: number
  lastActive: string
  averageSentiment: number | null

  contributions: IDbMemberContributionData[]
  affiliations: IDbMemberAffiliationData[]
  identities: IDbMemberIdentityData[]
  weakIdentities: IDbMemberIdentityData[]
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
}

export interface IMemberSegmentMatrix {
  [key: string]: IMemberSegmentMatrixItem[]
}
