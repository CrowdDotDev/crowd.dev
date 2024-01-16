import { IOrganizationIdentity } from '@crowd/types'
import { CompanyEnrichmentParams, CompanyResponse } from 'peopledatalabs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IEnrichmentResponse = CompanyResponse & { address?: any; geoLocation?: string }

export type EnrichmentParams = CompanyEnrichmentParams
export type IOrganizations = IOrganization[]

export interface IOrganization {
  id: string
  name: string
  tenantId?: string
  website?: string
  location?: string
  orgActivityCount?: number
  revenueRange?: { max: number; min: number }
  tags?: IEnrichmentResponse['tags']
  description?: IEnrichmentResponse['summary']
  employeeCountByCountry?: IEnrichmentResponse['employee_count_by_country']
  type?: IEnrichmentResponse['type']
  ticker?: IEnrichmentResponse['ticker']
  headline?: IEnrichmentResponse['headline']
  profiles?: IEnrichmentResponse['profiles']
  naics?: IEnrichmentResponse['naics']
  industry?: IEnrichmentResponse['industry']
  founded?: IEnrichmentResponse['founded']
  employees?: IEnrichmentResponse['employee_count']
  twitter?: ISocialNetwork
  github?: ISocialNetwork
  linkedin?: ISocialNetwork
  crunchbase?: ISocialNetwork
  lastEnrichedAt?: Date
  geoLocation?: string
  address?: IEnrichmentResponse['location']
  ultimateParent: IEnrichmentResponse['ultimate_parent']
  immediateParent: IEnrichmentResponse['immediate_parent']
  affiliatedProfiles?: IEnrichmentResponse['affiliated_profiles']
  allSubsidiaries?: IEnrichmentResponse['all_subsidiaries']
  alternativeDomains?: IEnrichmentResponse['alternative_domains']
  alternativeNames?: IEnrichmentResponse['alternative_names']
  averageEmployeeTenure?: IEnrichmentResponse['average_employee_tenure']
  averageTenureByLevel?: IEnrichmentResponse['average_tenure_by_level']
  averageTenureByRole?: IEnrichmentResponse['average_tenure_by_role']
  directSubsidiaries?: IEnrichmentResponse['direct_subsidiaries']
  employeeChurnRate?: IEnrichmentResponse['employee_churn_rate']
  employeeCountByMonth?: IEnrichmentResponse['employee_count_by_month']
  employeeGrowthRate?: IEnrichmentResponse['employee_growth_rate']
  employeeCountByMonthByLevel?: IEnrichmentResponse['employee_count_by_month_by_level']
  employeeCountByMonthByRole?: IEnrichmentResponse['employee_count_by_month_by_role']
  gicsSector?: IEnrichmentResponse['gics_sector']
  grossAdditionsByMonth?: IEnrichmentResponse['gross_additions_by_month']
  grossDeparturesByMonth?: IEnrichmentResponse['gross_departures_by_month']
  inferredRevenue?: IEnrichmentResponse['inferred_revenue']
  identities?: IOrganizationIdentity[]
}

interface ISocialNetwork {
  url: string
  handle: string
}
