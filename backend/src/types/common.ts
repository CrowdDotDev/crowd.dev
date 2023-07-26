export interface PageData<T> {
  rows: T[]
  count: number
  limit: number
  offset: number
}

export interface QueryData {
  filter?: any
  orderBy?: string
  limit?: number
  offset?: number
}

export interface SearchCriteria {
  limit?: number
  offset?: number
}

export enum FeatureFlag {
  AUTOMATIONS = 'automations',
  COMMUNITY_HELP_CENTER_PRO = 'community-help-center-pro',
  EAGLE_EYE = 'eagle-eye',
  CSV_EXPORT = 'csv-export',
  LINKEDIN = 'linkedin',
  HUBSPOT = 'hubspot',
  MEMBER_ENRICHMENT = 'member-enrichment',
  ORGANIZATION_ENRICHMENT = 'organization-enrichment',
  SEGMENTS = 'segments',
}

export enum FeatureFlagRedisKey {
  CSV_EXPORT_COUNT = 'csvExportCount',
  MEMBER_ENRICHMENT_COUNT = 'memberEnrichmentCount',
  ORGANIZATION_ENRICHMENT_COUNT = 'organizationEnrichmentCount',
}

export enum AuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
}
