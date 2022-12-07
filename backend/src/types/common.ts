export interface PageData<T> {
  rows: T[]
  count: number
  limit: number
  offset: number
}

export interface SearchCriteria {
  limit?: number
  offset?: number
}

export enum FeatureFlag {
  AUTOMATIONS = 'automations',
  COMMUNITY_HELP_CENTER_PRO = 'community-help-center-pro',
  EAGLE_EYE = 'eagle-eye',
  ORGANIZATIONS = 'organizations',
}

export enum Edition {
  COMMUNITY = 'community',
  CROWD_HOSTED = 'crowd-hosted',
}
