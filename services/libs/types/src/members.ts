import { IAttributes } from './attributes'
import { MemberAttributeOpensearch, MemberAttributeType, MemberIdentityType } from './enums/members'
import { IMemberOrganization, IOrganization, IOrganizationOpensearch } from './organizations'
import { ITagOpensearch } from './tags'
import { PlatformType } from './enums/platforms'

export interface IMemberAttribute {
  type: MemberAttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
  options?: string[]
}

export interface IMemberAttributeData extends IMemberAttribute {
  id: string
  createdAt: string
  updatedAt: string
}

export interface IMemberIdentity {
  id?: string
  sourceId?: string
  platform: string
  value: string
  type: MemberIdentityType
  tenantId?: string
  integrationId?: string
  memberId?: string
  createdAt?: string
  updatedAt?: string
  verified: boolean
}

export interface IActivityIdentity {
  username: string
  platform: string
}

export interface IMemberData {
  displayName?: string
  identities: IMemberIdentity[]
  attributes?: Record<string, unknown>
  joinedAt?: string
  organizations?: IOrganization[]
  reach?: Partial<Record<PlatformType, number>>
}

export interface IMember {
  id: string
  tenantId: string
  segmentId: string
  attributes: IAttributes
  name?: string // Deprecated
  displayName?: string
  avatarUrl?: string
  score: number
  lastEnriched?: Date | null
  enrichedBy?: string[] | null
  joinedAt: string
  createdAt: string
  manuallyCreated: boolean
  reach?: number
  numberOfOpenSourceContributions: number
  activeOn: string[]
  activityCount: number
  lastActive: string
  averageSentiment: number
  identities: IMemberIdentity[]
  organizations: IOrganizationOpensearch[]
  tags: ITagOpensearch[]
  toMergeIds: string[]
  noMergeIds: string[]
  lastActivity: unknown
  bio?: string
  location?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contributions?: any
}

export interface MemberIdentity {
  username: string
  integrationId: string
  sourceId?: string
}

export interface IMemberSyncRemoteData {
  id?: string
  memberId: string
  sourceId?: string
  integrationId: string
  syncFrom: string
  metaData: string
  lastSyncedAt?: string
}

export interface IMemberMergeSuggestion {
  similarity: number
  activityEstimate: number
  members: [string, string]
}

export interface IMemberReach {
  [key: string]: number
}

export interface IMemberUsername {
  [key: string]: string[]
}

export interface IMemberAffiliation {
  id: string
  dateStart: string
  dateEnd: string
  segmentId: string
  segmentName: string
  segmentSlug: string
  organizationId: string
  organizationLogo: string
  organizationName: string
  segmentParentName: string
}

export interface IMemberAffiliationMergeBackup {
  id: string
}

export interface IMemberContribution {
  id: number
  url: string
  topics: string[]
  summary: string
  numberCommits: 81
  lastCommitDate: string
  firstCommitDate: string
}

export interface IMemberRenderFriendlyRole {
  id: string
  logo: string
  displayName: string
  memberOrganizations: IMemberOrganization
}

export interface ILLMConsumableMemberDbResult {
  displayName: string
  attributes: IAttributes
  joinedAt: string
  identities: IMemberIdentity[]
  organizations: {
    logo: string
    displayName: string
    title: string
    dateStart: string
    dateEnd: string
    memberId: string
  }[]
}

export interface ILLMConsumableMember {
  displayName: string
  attributes: IAttributes
  joinedAt: string
  identities: {
    platform: string
    value: string
  }[]
  organizations: {
    logo: string
    displayName: string
    title: string
    dateStart: string
    dateEnd: string
  }[]
}

export interface IMemberBaseForMergeSuggestions {
  id: string
  tenantId: string
  displayName: string
  attributes: IAttributes
}

export interface IMemberWithAggregatesForMergeSuggestions extends IMemberBaseForMergeSuggestions {
  identities: IMemberIdentity[]
  activityCount: number
  organizations: IMemberOrganization[]
}

export interface IMemberIdentityOpensearch {
  keyword_type: string
  string_platform: string
  keyword_value: string
  string_value: string
  bool_verified: boolean
}

export interface IMemberOrganizationOpensearch {
  uuid_id: string
  string_logo: string
  string_displayName: string
  obj_memberOrganizations: {
    string_title: string
    date_dateStart: string
    date_dateEnd: string
    string_source: string
  }
}

export type IMemberAttributesOpensearch = {
  [key in MemberAttributeOpensearch]?: {
    string_default?: string
    string_arr_default?: string[]
  }
}

export interface IMemberOpensearch {
  uuid_memberId: string
  uuid_tenantId: string
  keyword_displayName: string
  string_displayName: string
  int_activityCount: number

  nested_identities: IMemberIdentityOpensearch[]
  nested_organizations: IMemberOrganizationOpensearch[]
  obj_attributes: IMemberAttributesOpensearch
}
