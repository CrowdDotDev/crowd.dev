export interface IMemberNoMerge {
  memberId: string
  noMergeId: string
}

export interface IMemberMergeSuggestionsLatestGeneratedAt {
  memberMergeSuggestionsLastGeneratedAt: string
}

export interface IMemberId {
  id: string
}

export interface ITenant {
  tenantId: string
  plan: string
}

export interface IOrganizationNoMerge {
  organizationId: string
  noMergeId: string
}

export interface IOrganizationMergeSuggestionsLatestGeneratedAt {
  organizationMergeSuggestionsLastGeneratedAt: string
}

export interface IOrganizationId {
  id: string
}

export interface IFindRawOrganizationMergeSuggestionsReplacement {
  similarityLTEFilter?: number
  similarityGTEFilter?: number
  organizationIds?: string[]
  limit: number
}

export interface IFindRawMemberMergeSuggestionsReplacement {
  similarityLTEFilter?: number
  similarityGTEFilter?: number
  limit: number
}

export interface IRawOrganizationMergeSuggestionResult {
  organizationId: string
  toMergeId: string
}

export interface IRawMemberMergeSuggestionResult {
  memberId: string
  toMergeId: string
}
