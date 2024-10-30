export enum OrganizationAttributeName {
  SOURCE_ID = 'sourceId',
  URL = 'url',
  SYNC_REMOTE = 'syncRemote',
  DOMAIN = 'domain',
}

export enum OrganizationSource {
  EMAIL_DOMAIN = 'email-domain',
  ENRICHMENT_PROGAI = 'enrichment-progai',
  ENRICHMENT_CLEARBIT = 'enrichment-clearbit',
  HUBSPOT = 'hubspot',
  GITHUB = 'github',
  UI = 'ui',
}

export enum OrganizationMergeSuggestionType {
  BY_IDENTITY = 'by_identity',
}

export enum OrganizationAttributeType {
  STRING = 'string',
  BOOLEAN = 'boolean',
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  OBJECT = 'object',
}

export enum OrganizationIdentityType {
  USERNAME = 'username',
  PRIMARY_DOMAIN = 'primary-domain',
  ALTERNATIVE_DOMAIN = 'alternative-domain',
  AFFILIATED_PROFILE = 'affiliated-profile',
}

export enum OrganizationAttributeSource {
  CUSTOM = 'custom',
  PDL = 'peopledatalabs',
  EMAIL = 'email',
  GITHUB = 'github',
}
