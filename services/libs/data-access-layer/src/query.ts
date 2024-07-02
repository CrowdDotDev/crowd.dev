enum Operator {
  AND = 'and',
  OR = 'or',
  NOT = 'not',
  LIKE = 'like',
  NOT_LIKE = 'notLike',
  EQ = 'eq',
  NE = 'ne',
  GT = 'gt',
  GTE = 'gte',
  LTE = 'lte',
  LT = 'lt',
  IN = 'in',
  NOT_IN = 'notIn',
  IS = 'is',
  IS_NULL = 'isNull',
  FIELD = 'field',
  VALUE = 'value',
}

type ANY_LITERAL = string | number | boolean

type GT = { [Operator.GT]: ANY_LITERAL }
type GTE = { [Operator.GTE]: ANY_LITERAL }
type LT = { [Operator.LT]: ANY_LITERAL }
type LTE = { [Operator.LTE]: ANY_LITERAL }
type EQ = { [Operator.EQ]: ANY_LITERAL }
type NE = { [Operator.NE]: ANY_LITERAL }
type LIKE = { [Operator.LIKE]: string }
type NOT_LIKE = { [Operator.NOT_LIKE]: string }
type IN = { [Operator.IN]: ANY_LITERAL[] }
type NOT_IN = { [Operator.NOT_IN]: ANY_LITERAL[] }

type ANY_OPERATOR = GT | GTE | LT | LTE | EQ | NE | LIKE | NOT_LIKE | IN | NOT_IN | NOT

type FIELD = { [key: string]: ANY_OPERATOR }
type NOT = { [Operator.NOT]: ANY_CLAUSE }
type AND = { [Operator.AND]: ANY_CLAUSE[] }
type OR = { [Operator.OR]: ANY_CLAUSE[] }

type ANY_CLAUSE = AND | OR | FIELD | null

type EMPTY = Record<string, never>
export type QueryFilter = ANY_CLAUSE | EMPTY
