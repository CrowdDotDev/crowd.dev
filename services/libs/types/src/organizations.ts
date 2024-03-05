import { IAttributes } from './attributes'
import { OrganizationSource } from './enums/organizations'

export interface IOrganization {
  // db fields
  id?: string
  description?: string
  emails?: string[]
  phoneNumbers?: number[]
  logo?: string
  tags?: string[]
  url?: string
  avatarUrl?: string
  twitter?: IOrganizationSocial
  linkedin?: IOrganizationSocial
  crunchbase?: IOrganizationSocial
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
  github?: IOrganizationSocial
  website?: string
  isTeamOrganization?: boolean
  lastEnrichedAt?: string | Date
  employeeCountByCountry?: Record<string, number>
  type?: string
  geoLocation?: string
  size?: string
  ticker?: string
  headline?: string
  profiles?: string[]
  address?: IOrganizationAddress
  industry?: string
  founded?: number
  displayName?: string
  attributes?: IAttributes
  searchSyncedAt?: string | Date
  manuallyCreated?: boolean
  affiliatedProfiles?: string[]
  allSubsidiaries?: string[]
  alternativeDomains?: string[]
  alternativeNames?: string[]
  averageEmployeeTenure?: number
  averageTenureByLevel?: Record<string, number>
  averageTenureByRole?: Record<string, number>
  directSubsidiaries?: string[]
  employeeChurnRate?: Record<string, number>
  employeeCountByMonth?: Record<string, number>
  employeeGrowthRate?: Record<string, number>
  employeeCountByMonthByLevel?: Record<string, number>
  employeeCountByMonthByRole?: Record<string, number>
  gicsSector?: string
  grossAdditionsByMonth?: Record<string, number>
  grossDeparturesByMonth?: Record<string, number>
  ultimateParent?: string
  immediateParent?: string
  weakIdentities?: IOrganizationIdentity[]
  manuallyChangedFields?: string[]
  naics?: IOrganizationNaics[]

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

export interface IOrganizationCache {
  id?: string
  url?: string
  description?: string
  emails?: string[]
  logo?: string
  tags?: string[]
  github?: IOrganizationSocial
  twitter?: IOrganizationSocial
  linkedin?: IOrganizationSocial
  crunchbase?: IOrganizationSocial
  employees?: number
  location?: string
  website?: string
  type?: string
  size?: string
  headline?: string
  industry?: string
  founded?: number
  attributes?: IAttributes
  immediateParent?: string
  ultimateParent?: string
  affiliatedProfiles?: string[]
  allSubsidiaries?: string[]
  alternativeDomains?: string[]
  alternativeNames?: string[]
  averageEmployeeTenure?: number
  averageTenureByLevel?: Record<string, number>
  averageTenureByRole?: Record<string, number>
  employeeChurnRate?: Record<string, number>
  employeeCountByMonth?: Record<string, number>
  employeeGrowthRate?: Record<string, number>
  employeeCountByMonthByLevel?: Record<string, number>
  employeeCountByMonthByRole?: Record<string, number>
  directSubsidiaries?: string[]
  gicsSector?: string
  grossAdditionsByMonth?: Record<string, number>
  grossDeparturesByMonth?: Record<string, number>
  identities: IOrganizationIdentity[]
  weakIdentities?: IOrganizationIdentity[]
  members?: string[]
  source?: OrganizationSource
  name?: string
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
  name: string
  sourceId?: string
  url?: string
}

export interface IEnrichableOrganization extends IOrganization {
  orgActivityCount: number
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
