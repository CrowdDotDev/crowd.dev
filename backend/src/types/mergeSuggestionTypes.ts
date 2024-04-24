export interface IFetchOrganizationMergeSuggestionFilter {
  similarity?: {
    lte?: number
    gte?: number
  }
  displayName?: string
  organizationId?: string
  projectIds?: string[]
  subprojectIds?: string[]
}


export interface IFetchMemberMergeSuggestionFilter {
  similarity?: {
    lte?: number
    gte?: number
  }
  displayName?: string
  memberId?: string
  projectIds?: string[]
  subprojectIds?: string[]
}

export interface IFetchMemberMergeSuggestionArgs {
  filter?: IFetchMemberMergeSuggestionFilter
  limit: number
  offset: number
  orderBy?: string[]
  detail: boolean
  countOnly: boolean
}


export interface IFetchOrganizationMergeSuggestionArgs {
  filter?: IFetchOrganizationMergeSuggestionFilter
  limit: number
  offset: number
  orderBy?: string[]
  detail: boolean
  countOnly: boolean
}