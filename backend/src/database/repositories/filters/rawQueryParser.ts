enum Operator {
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  NOT_EQUAL = 'ne',
  EQUAL = 'eq',

  // case insensitive ilike
  LIKE = 'like',
  NOT_LIKE = 'notLike',

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
}

export default class RawQueryParser {
  public static parseFilters(filters: any, columnMap: Map<string, string>, params: any): string {
    const keys = Object.keys(filters)
    if (keys.length === 0) {
      return '(1=1)'
    }

    const results = []

    for (const key of keys) {
      if (this.isOperator(key)) {
        const operands = []
        for (const operand of filters[key]) {
          operands.push(this.parseFilters(operand, columnMap, params))
        }

        const condition = operands.join(` ${key} `)
        results.push(`(${condition})`)
      } else {
        // it's a condition
        if (!columnMap.has(key)) {
          throw new Error(`Unknown filter key: ${key}!`)
        }

        const column = columnMap.get(key)
        const conditionKeys = Object.keys(filters[key])
        if (conditionKeys.length !== 1) {
          throw new Error(`Invalid condition! ${JSON.stringify(filters[key], undefined, 2)}`)
        }

        const operator = conditionKeys[0] as Operator
        const actualOperator = this.getOperator(operator)
        const value = filters[key][operator]

        const paramName = this.getParamName(key, params)
        params[paramName] = value

        results.push(`(${column} ${actualOperator} :${paramName})`)
      }
    }

    return results.join(' and ')
  }

  private static getOperator(operator: Operator): string {
    switch (operator) {
      case Operator.GREATER_THAN:
        return '>'
      case Operator.GREATER_THAN_OR_EQUAL:
        return '>='
      case Operator.LESS_THAN:
        return '<'
      case Operator.LESS_THAN_OR_EQUAL:
        return '<='
      case Operator.NOT_EQUAL:
        return '<>'
      case Operator.EQUAL:
        return '='
      case Operator.LIKE:
        return 'ilike'
      case Operator.NOT_LIKE:
        return 'not ilike'
      case Operator.AND:
        return 'and'
      case Operator.OR:
        return 'or'
      case Operator.IN:
        return 'in'
      case Operator.NOT_IN:
        return 'not in'
      case Operator.BETWEEN:
        return 'between'
      case Operator.NOT_BETWEEN:
        return 'not between'
      case Operator.OVERLAP:
        return '&&'
      case Operator.CONTAINS:
        return '@>'
      default:
        throw new Error(`Unknown operator: ${operator}!`)
    }
  }

  private static getParamName(column: string, params: any): string {
    let index = 1
    let value = params[`${column}_${index}`]

    while (value !== undefined) {
      index++
      value = params[`${column}_${index}`]
    }

    return `${column}_${index}`
  }

  private static isOperator(opOrCondition: any): boolean {
    const lower = opOrCondition.toLowerCase().trim()
    return lower === 'and' || lower === 'or'
  }
}
