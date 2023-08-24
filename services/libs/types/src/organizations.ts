import { IAttributes } from './attributes'

export interface IOrganization {
  id?: string
  name: string
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
  founded?: string
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
  inferredRevenue?: string
  recentExecutiveDepartures?: IExecutiveChange[]
  recentExecutiveHires?: IExecutiveChange[]
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
