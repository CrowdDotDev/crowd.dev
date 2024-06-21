import { IAttributes } from './attributes'
import { OrganizationIdentityType, OrganizationSource } from './enums/organizations'

export interface IOrganization {
  // db fields
  id?: string
  description?: string
  logo?: string
  tags?: string[]
  url?: string
  avatarUrl?: string
  employees?: number
  revenueRange?: IOrganizationRevenueRange
  importHash?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  deletedAt?: string | Date
  tenantId?: string
  createdById?: string
  updatedById?: string
  location?: string
  isTeamOrganization?: boolean
  lastEnrichedAt?: string | Date
  type?: string
  size?: string
  headline?: string
  industry?: string
  founded?: number
  displayName?: string
  searchSyncedAt?: string | Date
  manuallyCreated?: boolean
  employeeChurnRate?: Record<string, number>
  employeeGrowthRate?: Record<string, number>

  // calculated fields
  revenueRangeMin?: number
  revenueRangeMax?: number
  source?: OrganizationSource
  employeeChurnRate12Month?: number
  employeeGrowthRate12Month?: number

  // relations
  identities: IOrganizationIdentity[]
  members?: string[]
}

export interface IMemberOrganization {
  id?: string
  title?: string
  dateStart: Date | string
  dateEnd: Date | string
  memberId: string
  organizationId: string
  updatedAt?: string
  createdAt?: string
  source?: string
  deletedAt?: string
}

export interface IMemberRoleWithOrganization extends IMemberOrganization {
  organizationName: string
  organizationLogo: string
}

export interface IExecutiveChange {
  joined_date?: string
  pdl_id?: string
  job_title?: string
  job_title_role?: string
  job_title_sub_role?: string
  job_title_levels?: string[]
  new_company_id?: string
  new_company_job_title?: string
  new_company_job_title_role?: string
  new_company_job_title_sub_role?: string
  new_company_job_title_levels?: string[]
}

export interface IOrganizationSocial {
  handle: string
  url?: string
}

export interface IOrganizationOpensearch {
  id: string
  logo: string
  displayName: string
}

export interface IOrganizationSyncRemoteData {
  id?: string
  organizationId: string
  sourceId?: string
  integrationId: string
  syncFrom: string
  metaData: string
  lastSyncedAt?: string
}

export interface IOrganizationIdentity {
  organizationId?: string
  integrationId?: string
  platform: string
  value: string
  type: OrganizationIdentityType
  verified: boolean
  sourceId?: string
}

export interface IOrganizationMergeSuggestion {
  similarity: number
  organizations: [string, string]
}
export interface IOrganizationIdSource {
  id: string
  source: string
}

export interface IOrganizationRevenueRange {
  min: number
  max: number
}

export interface IOrganizationNaics {
  sector: string
  naics_code: string
  sub_sector: string
  industry_group: string
  naics_industry: string
  national_industry: string
}

export interface IOrganizationAddress {
  name: string
  metro: string
  region: string
  country: string
  locality: string
  continent: string
  postal_code: string
  address_line_2: string
  street_address: string
}
