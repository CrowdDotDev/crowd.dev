enum Operator {
  AND = 'and',
  EQ = 'eq',
  FIELD = 'field',
  GT = 'gt',
  GTE = 'gte',
  IN = 'in',
  IS = 'is',
  IS_NULL = 'isNull',
  LIKE = 'like',
  LT = 'lt',
  LTE = 'lte',
  NE = 'ne',
  NOT = 'not',
  NOT_IN = 'notIn',
  NOT_LIKE = 'notLike',
  OR = 'or',
  VALUE = 'value',
}

type ANY_LITERAL = string | number | boolean

type EQ = { [Operator.EQ]: ANY_LITERAL }
type GT = { [Operator.GT]: ANY_LITERAL }
type GTE = { [Operator.GTE]: ANY_LITERAL }
type IN = { [Operator.IN]: ANY_LITERAL[] }
type LIKE = { [Operator.LIKE]: string }
type LT = { [Operator.LT]: ANY_LITERAL }
type LTE = { [Operator.LTE]: ANY_LITERAL }
type NE = { [Operator.NE]: ANY_LITERAL }
type NOT_IN = { [Operator.NOT_IN]: ANY_LITERAL[] }
type NOT_LIKE = { [Operator.NOT_LIKE]: string }

type ANY_OPERATOR = GT | GTE | LT | LTE | EQ | NE | LIKE | NOT_LIKE | IN | NOT_IN | NOT

type FIELD = { [key: string]: ANY_OPERATOR }
type NOT = { [Operator.NOT]: ANY_CLAUSE }
type AND = { [Operator.AND]: ANY_CLAUSE[] }
type OR = { [Operator.OR]: ANY_CLAUSE[] }

type ANY_CLAUSE = AND | OR | FIELD | null

type EMPTY = Record<string, never>
export type QueryFilter = ANY_CLAUSE | EMPTY
