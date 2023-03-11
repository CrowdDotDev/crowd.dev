import { JsonColumnInfo } from './queryTypes'
import { singleOrDefault } from '../../../utils/arrays'

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

  NOT = 'not',
}

export default class RawQueryParser {
  public static parseFilters(
    filters: any,
    columnMap: Map<string, string>,
    jsonColumnInfos: JsonColumnInfo[],
    params: any,
  ): string {
    const keys = Object.keys(filters)
    if (keys.length === 0) {
      return '(1=1)'
    }

    const results = []

    for (const key of keys) {
      if (this.isOperator(key)) {
        const operands = []
        for (const operand of filters[key]) {
          operands.push(this.parseFilters(operand, columnMap, jsonColumnInfos, params))
        }

        const condition = operands.join(` ${key} `)
        results.push(`(${condition})`)
      } else {
        // it's a condition
        const jsonColumnInfo = this.getJsonColumnInfo(key, jsonColumnInfos)

        if (jsonColumnInfo === undefined && !columnMap.has(key)) {
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

        if (operator === Operator.BETWEEN || operator === Operator.NOT_BETWEEN) {
          // we need two values
          const firstParamName = this.getParamName(key, params)
          params[firstParamName] = value[0]

          const secondParamName = this.getParamName(key, params)
          params[secondParamName] = value[1]

          results.push(`(${column} ${actualOperator} :${firstParamName} and :${secondParamName})`)
        } else if (operator === Operator.CONTAINS || operator === Operator.OVERLAP) {
          // we need an array of values
          const paramNames: string[] = []

          for (const val of value) {
            const paramName = this.getParamName(key, params)
            params[paramName] = val
            paramNames.push(`:${paramName}`)
          }

          const paramNamesString = paramNames.join(', ')
          results.push(`(${column} ${actualOperator} array[${paramNamesString}])`)
        } else if (operator === Operator.IN || operator === Operator.NOT_IN) {
          // we need a list of values
          const paramNames: string[] = []

          for (const val of value) {
            const paramName = this.getParamName(key, params)
            params[paramName] = val
            paramNames.push(`:${paramName}`)
          }

          const paramNamesString = paramNames.join(', ')
          results.push(`(${column} ${actualOperator} (${paramNamesString}))`)
        } else {
          const paramName = this.getParamName(key, params)
          if (operator === Operator.LIKE || operator === Operator.NOT_LIKE) {
            params[paramName] = `%${value}%`
          } else {
            params[paramName] = value
          }

          results.push(`(${column} ${actualOperator} :${paramName})`)
        }
      }
    }

    return results.join(' and ')
  }

  private static getJsonColumnInfo(
    column: string,
    jsonColumnInfos: JsonColumnInfo[],
  ): JsonColumnInfo | undefined {
    return singleOrDefault(jsonColumnInfos, (jsonColumnInfo) => jsonColumnInfo.property === column)
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
      case Operator.NOT:
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
