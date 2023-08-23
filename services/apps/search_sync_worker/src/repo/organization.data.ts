export interface IDbOrganizationSyncData {
  // organization data
  organizationId: string
  segmentId: string
  tenantId: string
  address: unknown | null
  attributes: unknown
  createdAt: string
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
  revenueRange: unknown | null
  size: string | null
  type: string | null
  url: string | null
  website: string | null
  linkedin: unknown | null
  github: unknown | null
  crunchbase: unknown | null
  twitter: unknown | null

  // aggregate data
  joinedAt: string
  lastActive: string
  activeOn: string[]
  activityCount: number
  memberCount: number
  identities: string[]
}
