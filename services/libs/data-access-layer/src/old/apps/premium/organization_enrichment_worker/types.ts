import { IOrganizationIdentity, PlatformType } from '@crowd/types'

export const ENRICHMENT_PLATFORM_PRIORITY = [
  PlatformType.GITHUB,
  PlatformType.LINKEDIN,
  PlatformType.TWITTER,
]

export interface IEnrichableOrganizationData {
  organizationId: string
  tenantId: string
}

export interface IOrganizationSocialData {
  handle: string
  url?: string
}

export interface IOrganizationData {
  id: string
  tenantId: string
  description: string | null
  names: string[]
  emails: string[] | null
  phoneNumbers: string[] | null
  logo: string | null
  tags: string[] | null
  employees: number | null
  revenueRange: unknown | null
  location: string | null
  employeeCountByCountry: unknown | null
  type: string | null
  geoLocation: string | null
  size: string | null
  address: unknown | null
  industry: string | null
  founded: number | null
  displayName: string | null
  allSubsidiaries: string[] | null
  alternativeNames: string[] | null
  averageEmployeeTenure: number | null
  averageTenureByLevel: unknown | null
  averageTenureByRole: unknown | null
  directSubsidiaries: string[] | null
  employeeChurnRate: unknown | null
  employeeCountByMonth: unknown | null
  employeeGrowthRate: unknown | null
  employeeCountByMonthByLevel: unknown | null
  employeeCountByMonthByRole: unknown | null
  gicsSector: string | null
  grossAdditionsByMonth: unknown | null
  grossDeparturesByMonth: unknown | null
  ultimateParent: string | null
  immediateParent: string | null
  manuallyChangedFields: string[]
  identities: IOrganizationIdentity[]
}
