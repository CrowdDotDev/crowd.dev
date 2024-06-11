import { MemberAttributeOpensearch } from './enums'

interface ITermFilter {
  term: {
    uuid_tenantId: string
  }
}

interface IExistsFilter {
  exists: {
    field: string
  }
}

interface IRangeFilterMemberId {
  range: {
    uuid_memberId: {
      gt: string
    }
  }
}

interface IRangeFilterOrganizationId {
  range: {
    uuid_organizationId: {
      gt: string
    }
  }
}

interface IRangeFilterCreatedAt {
  range: {
    date_createdAt: {
      gt: string
    }
  }
}

export type IMemberFilter = ITermFilter | IRangeFilterMemberId | IRangeFilterCreatedAt
export type IOrganizationFilter =
  | ITermFilter
  | IRangeFilterOrganizationId
  | IRangeFilterCreatedAt
  | IExistsFilter

export interface IMemberQueryBody {
  from: number
  size: number
  query: {
    bool: {
      filter: IMemberFilter[]
    }
  }
  sort: {
    [key: string]: string
  }
  collapse: {
    field: string
  }
  _source: string[]
}

export interface IMemberIdentityOpensearch {
  keyword_type: string
  string_platform: string
  keyword_value: string
  string_value: string
  bool_verified: boolean
}

export interface IMemberOrganizationOpensearch {
  uuid_id: string
  string_logo: string
  string_displayName: string
  obj_memberOrganizations: {
    string_title: string
    date_dateStart: string
    date_dateEnd: string
    string_source: string
  }
}

export type IMemberAttributesOpensearch = {
  [key in MemberAttributeOpensearch]?: {
    string_default?: string
    string_arr_default?: string[]
  }
}

export interface IMemberPartialAggregatesOpensearch {
  uuid_memberId: string
  uuid_arr_noMergeIds: string[]
  keyword_displayName: string
  int_activityCount: number

  string_arr_verifiedEmails: string[]
  string_arr_unverifiedEmails: string[]
  string_arr_verifiedUsernames: string[]
  string_arr_unverifiedUsernames: string[]
  nested_identities: IMemberIdentityOpensearch[]
  nested_organizations: IMemberOrganizationOpensearch[]
  obj_attributes: IMemberAttributesOpensearch
}

export interface IMemberPartialAggregatesOpensearchRawResult {
  _source: IMemberPartialAggregatesOpensearch
}

export interface ISimilarMember {
  uuid_memberId: string
  keyword_displayName: string
  int_activityCount: number

  string_arr_verifiedEmails: string[]
  string_arr_unverifiedEmails: string[]
  string_arr_verifiedUsernames: string[]
  string_arr_unverifiedUsernames: string[]
  nested_identities: IMemberIdentityOpensearch[]
  nested_organizations: IMemberOrganizationOpensearch[]
  obj_attributes: IMemberAttributesOpensearch
}

export interface ISimilarMemberOpensearch {
  _source: ISimilarMember
}

// organizations

export interface IOrganizationIdentityOpensearch {
  string_platform: string
  string_name: string
  keyword_name: string
  string_url: string
}

export interface IOrganizationPartialAggregatesOpensearch {
  uuid_organizationId: string
  uuid_arr_noMergeIds: string[]
  keyword_displayName: string
  nested_identities: IOrganizationIdentityOpensearch[]
  string_location: string
  string_industry: string
  string_website: string
  string_ticker: string
  int_activityCount: number
}

export interface ISimilarOrganization {
  uuid_organizationId: string
  keyword_displayName: string
  nested_identities: IOrganizationIdentityOpensearch[]
  nested_weakIdentities: IOrganizationIdentityOpensearch[]
  string_location: string
  string_industry: string
  string_website: string
  string_ticker: string
  int_activityCount: number
}

export interface ISimilarOrganizationOpensearch {
  _source: ISimilarOrganization
}

export interface IOrganizationPartialAggregatesOpensearchRawResult {
  _source: IOrganizationPartialAggregatesOpensearch
}

export interface IOrganizationQueryBody {
  from: number
  size: number
  query: {
    bool: {
      filter: IOrganizationFilter[]
    }
  }
  sort: {
    [key: string]: string
  }
  collapse: {
    field: string
  }
  _source: string[]
}

export interface ILLMResult {
  body: ILLMBody
  prompt: string
  responseTimeSeconds: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelSpecificArgs: any
}

export interface ILLMBody {
  id: string
  type: string
  role: string
  model: string
  content: {
    type: string
    text: string
  }[]
  stop_reason: string
  stop_sequence: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export interface IProcessGenerateMemberMergeSuggestionsArgs {
  tenantId: string
  lastUuid?: string
}

export interface IProcessGenerateOrganizationMergeSuggestionsArgs {
  tenantId: string
  lastUuid?: string
}

export interface IProcessCheckSimilarityWithLLM {
  prompt: string
  modelId: string
  memberCouples?: string[][]
  organizationCouples?: string[][]
  region: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelSpecificArgs: any
}

export interface ISimilarityFilter {
  lte: number
  gte: number
}

export interface IProcessMergeOrganizationSuggestionsWithLLM {
  onlyLFXMembers?: boolean
  similarity: ISimilarityFilter
}
