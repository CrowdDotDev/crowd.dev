import { IOrganizationIdentity } from '@crowd/types'

export interface IDbOrganizationSyncData {
  // base
  organizationId: string
  tenantId: string
  displayName: string

  ticker: string | null
  industry: string | null
  location: string | null

  // identity
  website: string

  activityCount: number

  identities: IOrganizationIdentity[]
}

export interface IOrganizationBaseForMergeSuggestions {
  id: string
  tenantId: string
  displayName: string
  location: string
  industry: string
}

export interface IOrganizationFullAggregatesOpensearch
  extends IOrganizationBaseForMergeSuggestions {
  ticker: string
  identities: IOrganizationIdentity[]
  activityCount: number
  noMergeIds: string[]
  website: string
}

export interface IOrganizationIdentityOpensearch {
  string_platform: string
  string_type: string
  keyword_type: string
  string_value: string
  bool_verified: boolean
}

export interface IOrganizationForMergeSuggestionsOpensearch {
  uuid_organizationId: string
  uuid_tenantId?: string
  keyword_displayName: string
  nested_identities: IOrganizationIdentityOpensearch[]
  string_location: string
  string_industry: string
  string_website: string
  string_ticker: string
  int_activityCount: number
}
