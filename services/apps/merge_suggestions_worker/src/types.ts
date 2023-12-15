export interface ITenantId {
  tenantId: string
}

interface IMemberQueryFilter {
  term?: {
    uuid_tenantId: string
  }
  range?: {
    uuid_memberId?: {
      gt: string
    }
  }
}

export interface IMemberQueryBody {
  from: number
  size: number
  query: {
    bool: {
      filter: IMemberQueryFilter[]
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
  string_platform: string
  string_username: string
}

export interface IMemberPartialAggregatesOpensearch {
  uuid_memberId: string
  nested_identities: IMemberIdentityOpensearch[]
  uuid_arr_noMergeIds: string[]
  keyword_displayName: string
  string_arr_emails: string[]
}

export interface IMemberPartialAggregatesOpensearchRawResult {
  _source: IMemberPartialAggregatesOpensearch
}

export interface ISimilarMember {
  uuid_memberId: string
  nested_identities: IMemberIdentityOpensearch[]
  nested_weakIdentities: IMemberIdentityOpensearch[]
  keyword_displayName: string
  string_arr_emails: string[]
}

export interface ISimilarMemberOpensearch {
  _source: ISimilarMember
}

export interface IMemberNoMerge {
  memberId: string
  noMergeId: string
}

export interface IMemberId {
  id: string
}
