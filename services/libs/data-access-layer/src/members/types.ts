import { IAttributes, IMemberAttribute, MemberAttributeType, SegmentType } from '@crowd/types'

export interface IQueryNumberOfNewMembers {
  segmentIds?: string[]
  after?: Date
  before?: Date
  platform?: string
}

export interface IQueryTimeseriesOfNewMembers {
  segmentIds?: string[]
  after: Date
  before: Date
  platform?: string
}

export interface IMemberSegmentCoreAggregates {
  memberId: string
  segmentId: string

  activityCount: number
  activeOn: string[]
}

export interface IMemberSegmentDisplayAggregates {
  memberId: string
  segmentId: string

  lastActive: string
  activityTypes: string[]
  averageSentiment: number
}

export interface IMemberSegmentAggregates
  extends IMemberSegmentCoreAggregates,
    IMemberSegmentDisplayAggregates {}

export interface IMemberActivitySummary {
  activityCount: number
  lastActive: string
}

export interface AttributeData extends IMemberAttribute {
  id: string
  createdAt: string
  updatedAt: string
}

export interface IDbMemberAttributeSetting {
  id: string
  type: MemberAttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
  options: unknown
}

export interface IDbMemberTag {
  id: string
}

export interface IDbMemberData {
  id: string
  tags: IDbMemberTag[]
  displayName: string

  activityCount?: number
  lastActive?: string
  activityTypes?: string[]
  activeOn?: string[]
  averageSentiment?: number
  activeDaysCount?: number

  organizations?: Array<{
    id: string
    displayName: string
    logo: string
    lfxMembership: boolean
  }>

  segments?: Array<{
    id: string
    name: string
    activityCount: number
  }>

  maintainerRoles?: Array<{
    segmentId: string
    segmentName: string
  }>

  identities?: Array<{
    type: string
    value: string
    platform: string
    verified: boolean
  }>
}

export interface IDbMemberBotSuggestion {
  id: string
  memberId: string
  confidence: number
  createdAt: string
}

export type IDbMemberBotSuggestionInsert = Omit<
  IDbMemberBotSuggestion,
  'id' | 'createdAt' | 'updatedAt'
>

export interface IDbMemberBotSuggestionBySegment {
  activityCount: number
  memberId: string
  confidence: number
  displayName: string
  avatarUrl: string
  attributes: IAttributes
}

export interface MemberOrganization {
  id: string
  organizationId: string
  dateStart?: string
  dateEnd?: string
  affiliationOverride?: {
    isPrimaryWorkExperience?: boolean
  }
}

export interface MemberOrganizationData {
  memberId: string
  organizations: MemberOrganization[]
}

export interface OrganizationInfo {
  id: string
  displayName: string
  logo: string
  createdAt: string
}

export interface MemberSegmentData {
  memberId: string
  segments: Array<{
    segmentId: string
    activityCount: number
  }>
}

export interface IncludeOptions {
  identities?: boolean
  segments?: boolean
  memberOrganizations?: boolean
  onlySubProjects?: boolean
  maintainers?: boolean
}

export interface OrganizationExtra {
  orgs: OrganizationInfo[]
  lfx: Array<{
    organizationId: string
    [key: string]: unknown
  }>
}

export interface MemberSegment {
  memberId: string
  segments: Array<{
    segmentId: string
    activityCount: number
    [key: string]: unknown
  }>
}

export interface SegmentInfo {
  id: string
  name?: string
  type?: SegmentType
  [key: string]: unknown
}

export interface MaintainerRole {
  memberId: string
  segmentId: string
  [key: string]: unknown
}

export interface MemberIdentityData {
  memberId: string
  identities: Array<{
    type: string
    value: string
    platform: string
    verified: boolean
  }>
}

export interface MemberOrganization {
  id: string
  organizationId: string
  dateStart?: string
  dateEnd?: string
  affiliationOverride?: {
    isPrimaryWorkExperience?: boolean
  }
}

export interface MemberOrganizationData {
  memberId: string
  organizations: MemberOrganization[]
}

export interface OrganizationInfo {
  id: string
  displayName: string
  logo: string
  createdAt: string
}

export interface QueryPreparationResult {
  mainQuery: string
  countQuery: string
  params: Record<string, unknown>
  preparedFields: string
}

export interface IncludeOptions {
  identities?: boolean
  segments?: boolean
  memberOrganizations?: boolean
  onlySubProjects?: boolean
  maintainers?: boolean
}
