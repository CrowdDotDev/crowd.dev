import { MemberAttributeType } from './enums/members'

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

  ARRAY_LENGTH = 'arrayLength',
}

export interface ParsedJsonColumn {
  parts: string[]
  info: JsonColumnInfo
}

export interface JsonColumnInfo {
  property: string
  column: string
  attributeInfos: AttributeInfo[]
}

export interface AttributeInfo {
  name: string
  type: MemberAttributeType
}
