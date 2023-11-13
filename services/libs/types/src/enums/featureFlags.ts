export enum FeatureFlag {
  AUTOMATIONS = 'automations',
  EAGLE_EYE = 'eagle-eye',
  CSV_EXPORT = 'csv-export',
  LINKEDIN = 'linkedin',
  HUBSPOT = 'hubspot',
  MEMBER_ENRICHMENT = 'member-enrichment',
  ORGANIZATION_ENRICHMENT = 'organization-enrichment',
  SEGMENTS = 'segments',

  // opensearch
  SYNCHRONOUS_OPENSEARCH_UPDATES = 'synchronous-opensearch-updates',

  // temporal
  TEMPORAL_AUTOMATIONS = 'temporal-automations',

  // new sentiment
  NEW_SENTIMENT = 'new-sentiment',
}

export enum FeatureFlagRedisKey {
  CSV_EXPORT_COUNT = 'csvExportCount',
  MEMBER_ENRICHMENT_COUNT = 'memberEnrichmentCount',
  ORGANIZATION_ENRICHMENT_COUNT = 'organizationEnrichmentCount',
}
