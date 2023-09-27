export enum OrganizationAttributeName {
  SOURCE_ID = 'sourceId',
  URL = 'url',
  SYNC_REMOTE = 'syncRemote',
  DOMAIN = 'domain',
}

export enum OrganizationSource {
  EMAIL_DOMAIN = 'email-domain',
  ENRICHMENT = 'enrichment',
  HUBSPOT = 'hubspot',
  GITHUB = 'github',
  UI = 'ui',
}

export enum OrganizationMergeSuggestionType {
  SAME_IDENTITY = 'same_identity',
  SIMILAR_IDENTITY = 'similar_identity',
}
