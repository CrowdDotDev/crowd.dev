import { MemberAttributeOpensearch } from './enums'

interface ITermFilter {
  term: {
    uuid_tenantId: string
  }
}

interface IRangeFilterMemberId {
  range: {
    uuid_memberId: {
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
    string_default: string
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
