export enum FeatureFlag {
  AUTOMATIONS = 'automations',
  EAGLE_EYE = 'eagle-eye',
  CSV_EXPORT = 'csv-export',
  LINKEDIN = 'linkedin',
  HUBSPOT = 'hubspot',
  MEMBER_ENRICHMENT = 'member-enrichment',
  ORGANIZATION_ENRICHMENT = 'organization-enrichment',
  SEGMENTS = 'segments',
  PRIORITIZED_QUEUES = 'prioritized-queues',
  FIND_GITHUB = 'find-github',

  // opensearch
  SYNCHRONOUS_OPENSEARCH_UPDATES = 'synchronous-opensearch-updates',

  // temporal
  TEMPORAL_MEMBERS_ENRICHMENT = 'temporal-members-enrichment',
  TEMPORAL_MEMBER_MERGE_SUGGESTIONS = 'temporal-member-merge-suggestions',
  SERVE_PROFILES_OPENSEARCH = 'serve-profiles-opensearch',
}

export enum FeatureFlagRedisKey {
  CSV_EXPORT_COUNT = 'csvExportCount',
  MEMBER_ENRICHMENT_COUNT = 'memberEnrichmentCount',
  ORGANIZATION_ENRICHMENT_COUNT = 'organizationEnrichmentCount',
}
