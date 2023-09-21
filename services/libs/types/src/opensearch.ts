/* eslint-disable @typescript-eslint/no-explicit-any */

export interface FieldTranslator {
  crowdToOpensearch: Map<string, string>
  opensearchToCrowd: Map<string, string>
}

export interface MemberStaticFieldsTranslation {
  id: string
  tenantId: string
  displayName: string
  emails: string
  score: string
  lastEnriched: string
  joinedAt: string
  totalReach: string
  numberOfOpenSourceContributions: string
  activeOn: string
  activityCount: string
  activityTypes: string
  activeDaysCount: string
  lastActive: string
  averageSentiment: string
  identities: string
}

export interface CustomOpensearchTranslation {
  fromOpensearch: string
  toOpensearch: string
}

export interface OpensearchField {
  type: string
  customTranslation?: CustomOpensearchTranslation
  dynamic?: boolean
  realType?: string
  preventNestedFieldTranslation?: boolean
  objectAsString?: boolean
}

export interface OpensearchQueryCriteria {
  filter: any
  limit: number
  offset: number
  orderBy: any
}

export interface OpensearchQuery {
  query: any
  size: number
  from: number
  sort: any
}

export interface IOpenSearchConfig {
  node: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
}
