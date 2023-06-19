/* eslint-disable no-lonely-if */

import FieldTranslator from './fieldTranslator'
import { OpenSearchIndex, Operator, OpensearchQuery, OpensearchQueryCriteria } from '@crowd/types'

export class OpensearchQueryParser {
  static parse(
    criteria: OpensearchQueryCriteria,
    index: OpenSearchIndex,
    translator: FieldTranslator,
  ): OpensearchQuery {
    const query = this.parseFilters(criteria.filter, index, translator)

    const from = criteria.offset

    const size = criteria.limit

    // sorting comes with the form `joinedAt_DESC`
    const sorterSplit = criteria.orderBy.split('_')

    const sort = [
      {
        [translator.crowdToOpensearch(sorterSplit[0])]: sorterSplit[1].toLowerCase(),
      },
    ]

    return { query, from, size, sort }
  }

  static parseFilters(filters: any, index: OpenSearchIndex, translator: FieldTranslator) {
    const query = {
      bool: {
        must: [],
      },
    } as any
    const keys = Object.keys(filters)

    for (const key of keys) {
      if (this.isOperator(key)) {
        const operands = []

        for (const operand of filters[key]) {
          operands.push(this.parseFilters(operand, index, translator))
        }
        const op = this.getOpensearchOperator(key)
        if (op === 'must') {
          query.bool.must.push(...operands)
        } else {
          query.bool.must.push({
            bool: {
              [op]: [...operands],
            },
          })
        }
      } else if (key === Operator.NOT) {
        query.bool = {
          must_not: this.parseFilters(filters[key], index, translator),
        }
      } else if (translator.fieldExists(key)) {
        const searchKey: string = translator.crowdToOpensearch(key)

        query.bool.must.push(this.parseColumnCondition(key, filters[key], searchKey))
      } else {
        throw new Error(`Unknown field or operator: ${key}!`)
      }
    }

    return query
  }

  private static isOperator(opOrCondition: any): boolean {
    const lower = opOrCondition.toLowerCase().trim()
    return lower === 'and' || lower === 'or'
  }

  private static getOpensearchOperator(operator: string): string {
    const lower = operator.toLowerCase().trim()

    if (lower === 'and') {
      return 'must'
    }

    if (lower === 'or') {
      return 'should'
    }

    throw new Error('Bad op!')
  }

  private static parseColumnCondition(key: string, filters: any, searchKey: any): any {
    const conditionKeys = Object.keys(filters)
    if (conditionKeys.length !== 1) {
      throw new Error(`Invalid condition! ${JSON.stringify(filters, undefined, 2)}`)
    }

    const operator = conditionKeys[0] as Operator
    let value = filters[operator]

    if (operator === Operator.EQUAL) {
      return {
        term: {
          [searchKey]: value,
        },
      }
    }

    if (
      [
        Operator.LESS_THAN,
        Operator.LESS_THAN_OR_EQUAL,
        Operator.GREATER_THAN,
        Operator.GREATER_THAN_OR_EQUAL,
      ].includes(operator)
    ) {
      return {
        range: {
          [searchKey]: {
            [operator]: value,
          },
        },
      }
    }

    if (operator === Operator.LIKE || operator === Operator.TEXT_CONTAINS) {
      value = value.toLowerCase()
      return {
        wildcard: {
          [searchKey]: {
            value: `${value}*`,
          },
        },
      }
    }

    if (operator === Operator.NOT || operator === Operator.NOT_EQUAL) {
      return {
        bool: {
          must_not: {
            term: {
              [searchKey]: value,
            },
          },
        },
      }
    }

    if (operator === Operator.NOT_LIKE || operator === Operator.NOT_TEXT_CONTAINS) {
      value = value.toLowerCase()
      return {
        bool: {
          must_not: {
            wildcard: {
              [searchKey]: {
                value: `${value}*`,
              },
            },
          },
        },
      }
    }

    if (operator === Operator.BETWEEN) {
      return {
        range: {
          [searchKey]: {
            gte: value[0],
            lte: value[1],
          },
        },
      }
    }

    if (operator === Operator.NOT_BETWEEN) {
      return {
        bool: {
          must_not: {
            range: {
              [searchKey]: {
                gte: value[0],
                lte: value[1],
              },
            },
          },
        },
      }
    }

    if (operator === Operator.REGEX) {
      value = value.toLowerCase()
      return {
        regexp: {
          [searchKey]: {
            value,
          },
        },
      }
    }

    if (operator === Operator.NOT_REGEX) {
      value = value.toLowerCase()
      return {
        bool: {
          must_not: {
            regexp: {
              [searchKey]: {
                value,
              },
            },
          },
        },
      }
    }

    if (operator === Operator.IN) {
      if (!Array.isArray(value)) {
        throw new Error('IN should be used with an array of values!')
      }

      const subQueries = value.map((v) => ({ match: { [searchKey]: v } }))

      return {
        bool: {
          should: subQueries,
        },
      }
    }

    if (operator === Operator.NOT_IN) {
      if (!Array.isArray(value)) {
        throw new Error('notIn should be used with an array of values!')
      }

      const subQueries = value.map((v) => ({ match: { [searchKey]: v } }))

      return {
        bool: {
          must_not: subQueries,
        },
      }
    }

    if (operator === Operator.CONTAINS) {
      return {
        match: {
          [searchKey]: value,
        },
      }
    }

    if (operator === Operator.OVERLAP) {
      if (!Array.isArray(value)) {
        throw new Error('Overlap should be used with an array of values!')
      }

      return {
        terms: {
          [searchKey]: value,
        },
      }
    }

    return {
      term: {
        [searchKey]: value,
      },
    }
  }
}
