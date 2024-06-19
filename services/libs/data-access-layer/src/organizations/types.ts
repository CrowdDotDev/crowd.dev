import { OrganizationIdentityType } from '@crowd/types'

export interface IOrganization {
  id: string
  tenantId: string
  description?: string
  displayName?: string
  logo?: string
  tags?: string[]
  employees?: number
  revenueRange?: unknown
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

  attributes: IOrgAttribute[]
}

export enum OrgAttributeType {
  STRING = 'string',
  BOOLEAN = 'boolean',
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  OBJECT = 'object',
}

export interface IOrgAttribute {
  id?: string
  type: OrgAttributeType
  name: string
  source: string
  default: boolean
  value?: string
}

export interface IOrgAttributeInput {
  type: OrgAttributeType
  name: string
  source: string
  default: boolean
  value?: string
}

export interface IOrganizationAggregateData {
  organizationId: string
  segmentId: string
  tenantId: string

  joinedAt: string
  lastActive: string
  activeOn: string[]
  activityCount: number
  memberCount: number
}

export interface IOrgIdentity {
  platform: string
  type: OrganizationIdentityType
  value: string
  verified: boolean
  sourceId?: string
  integrationId?: string
}

export interface IOrgIdentityInsertInput {
  organizationId: string
  tenantId: string
  platform: string
  value: string
  type: OrganizationIdentityType
  verified: boolean
  sourceId?: string
  integrationId?: string
}

export interface IOrgIdentityUpdateInput {
  organizationId: string
  tenantId: string
  platform: string
  value: string
  type: OrganizationIdentityType
  verified: boolean
}
