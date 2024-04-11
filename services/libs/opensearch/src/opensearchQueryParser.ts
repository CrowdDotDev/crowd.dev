/* eslint-disable @typescript-eslint/no-explicit-any */

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

    let sortField = translator.crowdToOpensearch(sorterSplit[0])

    if (sortField === 'string_displayName') {
      sortField = 'keyword_displayName'
    }

    const sort = [
      {
        [sortField]: sorterSplit[1].toLowerCase(),
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

        if (translator.isNestedField(searchKey)) {
          // Extract the path to the nested object
          const nestedPath = searchKey.split('.')[0]
          query.bool.must.push({
            nested: {
              path: nestedPath,
              query: this.parseColumnCondition(filters[key], searchKey),
            },
          })
        } else {
          query.bool.must.push(this.parseColumnCondition(filters[key], searchKey))
        }
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

  private static parseColumnCondition(filters: any, searchKey: string): any {
    const conditionKeys = Object.keys(filters)
    if (conditionKeys.length !== 1) {
      throw new Error(`Invalid condition! ${JSON.stringify(filters, undefined, 2)}`)
    }

    const operator = conditionKeys[0] as Operator
    let value = filters[operator]

    if (typeof value === 'string' && !searchKey.startsWith('date')) {
      value = value.toLowerCase()
    }

    if (operator === Operator.MATCH_PHRASE_PREFIX) {
      return {
        match_phrase_prefix: {
          [searchKey]: {
            query: value,
          },
        },
      }
    }

    if (operator === Operator.EQUAL) {
      if (value === null) {
        return {
          bool: {
            must_not: {
              exists: {
                field: searchKey,
              },
            },
          },
        }
      }

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
      return {
        wildcard: {
          [searchKey]: {
            value: `*${value}*`,
          },
        },
      }
    }

    if (operator === Operator.NOT || operator === Operator.NOT_EQUAL) {
      if (value === null) {
        return {
          exists: {
            field: searchKey,
          },
        }
      }

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
      return {
        bool: {
          must_not: {
            wildcard: {
              [searchKey]: {
                value: `*${value}*`,
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
      return {
        regexp: {
          [searchKey]: {
            value,
          },
        },
      }
    }

    if (operator === Operator.NOT_REGEX) {
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

      return {
        terms: {
          [searchKey]: value,
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
      if (!Array.isArray(value)) {
        return {
          match_phrase: {
            [searchKey]: value,
          },
        }
      }

      const subQueries = value.map((v) => ({ match_phrase: { [searchKey]: v } }))

      return {
        bool: {
          must: subQueries,
        },
      }
    }

    if (operator === Operator.OVERLAP) {
      if (!Array.isArray(value)) {
        throw new Error('Overlap should be used with an array of values!')
      }

      const subQueries = value.map((v) => ({ match_phrase: { [searchKey]: v } }))

      return {
        bool: {
          should: subQueries,
        },
      }
    }

    if (operator === Operator.ARRAY_LENGTH) {
      if (typeof value !== 'object') {
        throw new Error(
          'Array length should be used with an object containing operators and their values!',
        )
      }

      const operatorsMapping = {
        gte: '>=',
        lte: '<=',
        gt: '>',
        lt: '<',
        eq: '==',
      }

      const scriptQueries = Object.entries(value).map(([lengthOperator, arrayLength]) => {
        if (typeof arrayLength !== 'number') {
          throw new Error(`Array length value for operator ${lengthOperator} should be a number!`)
        }

        if (!Object.prototype.hasOwnProperty.call(operatorsMapping, lengthOperator)) {
          throw new Error(`Invalid operator "${lengthOperator}" used in ARRAY_LENGTH`)
        }

        return {
          script: {
            source: `doc['${searchKey}'].length ${operatorsMapping[lengthOperator]} params.length`,
            lang: 'painless',
            params: {
              length: arrayLength,
            },
          },
        }
      })

      return {
        bool: {
          must: scriptQueries,
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
