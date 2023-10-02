import { IOrganizationIdentity } from '@crowd/types'

export interface IDbOrganizationSyncData {
  // organization data
  organizationId: string
  segmentId: string
  tenantId: string
  address: unknown | null
  attributes: unknown
  createdAt: string
  manuallyCreated: boolean
  description: string | null
  displayName: string
  emails: string[]
  employeeCountByCountry: unknown | null
  employees: number | null
  founded: number | null
  geoLocation: string | null
  headline: string | null
  importHash: string | null
  industry: string | null
  isTeamOrganization: boolean
  lastEnrichedAt: string | null
  location: string | null
  logo: string | null
  naics: unknown[] | null
  name: string
  phoneNumbers: string[] | null
  profiles: string[] | null
  revenueRange: { min?: number; max?: number } | null
  size: string | null
  type: string | null
  url: string | null
  website: string | null
  linkedin: unknown | null
  github: unknown | null
  crunchbase: unknown | null
  twitter: unknown | null
  immediateParent: string | null
  ultimateParent: string | null
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
  weakIdentities: IOrganizationIdentity[]
  employeeChurnRate12Month: number | null
  employeeGrowthRate12Month: number | null
  tags: string[] | null

  // aggregate data
  joinedAt: string
  lastActive: string
  activeOn: string[]
  activityCount: number
  memberCount: number
  identities: IOrganizationIdentity[]
}
