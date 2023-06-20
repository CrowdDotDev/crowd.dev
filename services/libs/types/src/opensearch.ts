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

export interface OpensearchField {
  type: string
  dynamic?: boolean
  realType?: string
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

export enum Operator {
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  NOT_EQUAL = 'ne',
  EQUAL = 'eq',

  // case insensitive ilike
  LIKE = 'like',
  NOT_LIKE = 'notLike',

  TEXT_CONTAINS = 'textContains',
  NOT_TEXT_CONTAINS = 'notContains',

  REGEX = 'regexp',
  NOT_REGEX = 'notRegexp',

  AND = 'and',
  OR = 'or',

  IN = 'in',
  NOT_IN = 'notIn',

  BETWEEN = 'between',
  NOT_BETWEEN = 'notBetween',

  OVERLAP = 'overlap',
  CONTAINS = 'contains',

  NOT = 'not',
}
