import { PlatformType, TenantPlans } from '@crowd/types'

export const ENRICHMENT_PLATFORM_PRIORITY = [
  PlatformType.GITHUB,
  PlatformType.LINKEDIN,
  PlatformType.TWITTER,
]

export interface IEnrichableOrganizationCache {
  id: string
  tenants: {
    id: string
    plan: TenantPlans
    name: string
  }[]
}

export interface IPremiumTenantInfo {
  id: string
  plan: TenantPlans
  orgData: {
    lastEnrichedAt: string
    organizationCacheId: string
    organizationId: string
  }[]
}
export interface IOrganizationCacheIdentity {
  name: string
  website: string | null
}

export interface IOrganizationSocialData {
  handle: string
  url?: string
}

export interface IOrganizationCacheData {
  id: string
  description: string | null
  emails: string[] | null
  phoneNumbers: string[] | null
  logo: string | null
  tags: string[] | null
  twitter: IOrganizationSocialData | null
  linkedin: IOrganizationSocialData | null
  crunchbase: unknown | null
  employees: number | null
  revenueRange: unknown | null
  location: string | null
  github: IOrganizationSocialData | null
  employeeCountByCountry: unknown | null
  type: string | null
  geoLocation: string | null
  size: string | null
  ticker: string | null
  headline: string | null
  profiles: string[] | null
  naics: unknown[] | null
  address: unknown | null
  industry: string | null
  founded: number | null
  affiliatedProfiles: string[] | null
  allSubsidiaries: string[] | null
  alternativeDomains: string[] | null
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
  identities: IOrganizationCacheIdentity[]
}

export interface IOrganizationIdentity {
  platform: string
  name: string
  url: string | null
}

export interface IOrganizationData {
  id: string
  tenantId: string
  description: string | null
  emails: string[] | null
  phoneNumbers: string[] | null
  logo: string | null
  tags: string[] | null
  twitter: IOrganizationSocialData | null
  linkedin: IOrganizationSocialData | null
  crunchbase: unknown | null
  employees: number | null
  revenueRange: unknown | null
  location: string | null
  github: IOrganizationSocialData | null
  website: string | null
  employeeCountByCountry: unknown | null
  type: string | null
  geoLocation: string | null
  size: string | null
  address: unknown | null
  industry: string | null
  founded: number | null
  displayName: string | null
  affiliatedProfiles: string[] | null
  allSubsidiaries: string[] | null
  alternativeDomains: string[] | null
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
  weakIdentities: IOrganizationIdentity[]
}
