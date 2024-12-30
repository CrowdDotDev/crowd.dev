import {
  IOrganizationRevenueRange,
  OrganizationAttributeSource,
  OrganizationIdentityType,
  PlatformType,
} from '@crowd/types'

export interface IDbOrganization {
  id: string
  tenantId: string
  description?: string
  displayName: string
  logo?: string
  tags?: string[]
  employees?: number
  revenueRange?: IOrganizationRevenueRange
  importHash?: string
  location?: string
  isTeamOrganization: boolean
  type?: string
  size?: string
  headline?: string
  industry?: string
  founded?: number
  employeeChurnRate?: unknown
  employeeGrowthRate?: unknown
  manuallyCreated: boolean
}

export interface IDbOrganizationInput {
  description?: string
  displayName?: string
  logo?: string
  tags?: string[]
  employees?: number
  revenueRange?: IOrganizationRevenueRange
  importHash?: string
  location?: string
  isTeamOrganization: boolean
  type?: string
  size?: string
  headline?: string
  industry?: string
  founded?: number
  employeeChurnRate?: unknown
  employeeGrowthRate?: unknown
  manuallyCreated: boolean
}

export interface IDbOrgAttribute {
  id?: string
  name: string
  source: OrganizationAttributeSource
  default: boolean
  value: string
}

export interface IDbOrgAttributeInput {
  name: string
  source: string
  default: boolean
  value: string
}

export interface IDbOrganizationAggregateData {
  organizationId: string
  segmentId?: string
  tenantId: string
  joinedAt: string
  lastActive: string
  activeOn: string[]
  activityCount: number
  memberCount: number
  avgContributorEngagement: number
}

export interface IDbOrgIdentity {
  platform: string
  type: OrganizationIdentityType
  value: string
  verified: boolean
  sourceId?: string
  integrationId?: string
}

export interface IDbOrgIdentityInsertInput {
  organizationId: string
  tenantId: string
  platform: string
  value: string
  type: OrganizationIdentityType
  verified: boolean
  sourceId?: string
  integrationId?: string
}

export interface IDbOrgIdentityUpdateInput {
  organizationId: string
  tenantId: string
  platform: string
  value: string
  type: OrganizationIdentityType
  verified: boolean
}

export const ENRICHMENT_PLATFORM_PRIORITY = [
  PlatformType.GITHUB,
  PlatformType.LINKEDIN,
  PlatformType.TWITTER,
]

export interface IEnrichableOrganizationData {
  organizationId: string
  tenantId: string
}

export interface IQueryNumberOfNewOrganizations {
  tenantId: string
  segmentIds?: string[]
  after?: Date
  before?: Date
  platform?: string
}

export interface IQueryTimeseriesOfNewOrganizations {
  tenantId: string
  segmentIds?: string[]
  after: Date
  before: Date
  platform?: string
}

export interface IQueryNumberOfActiveOrganizations {
  tenantId: string
  segmentIds?: string[]
  after: Date
  before: Date
  platform?: string
}
