import lodash from 'lodash'
import validator from 'validator'
import { v4 as uuid } from 'uuid'
import Sequelize from 'sequelize'
import { IRepositoryOptions } from '../IRepositoryOptions'
import SequelizeRepository from '../sequelizeRepository'
import { QueryInput } from './queryTypes'

const { Op } = Sequelize

/**
 * Pass `db` connection object which has `Sequelize.Op`
 * @param {*} db
 * @returns object {parse}
 */
class QueryParser {
  private options: IRepositoryOptions

  private aggregators: any

  private whereOrHaving: string

  static maxPageSize = 200

  static defaultPageSize = 10

  static operators = {
    gt: Op.gt,
    gte: Op.gte,
    lt: Op.lt,
    lte: Op.lte,
    ne: Op.ne,
    eq: Op.eq,
    not: Op.not,
    // like: Op.like, // LIKE '%hat'
    // notLike: Op.notLike, // NOT LIKE '%hat'
    like: Op.iLike, // ILIKE '%hat' (case insensitive) (PG only)
    notLike: Op.notILike, // NOT ILIKE '%hat'  (PG only)
    regexp: Op.regexp, // REGEXP/~ '^[h|a|t]' (MySQL/PG only)
    notRegexp: Op.notRegexp, // NOT REGEXP/!~ '^[h|a|t]' (MySQL/PG only)
    // iRegexp: Op.iRegexp,            // ~* '^[h|a|t]' (PG only)
    // notIRegexp: Op.notIRegexp       // !~* '^[h|a|t]' (PG only)
    and: Op.and, // AND (a = 5)
    or: Op.or, // (a = 5 OR a = 6)
    between: Op.between, // BETWEEN 6 AND 10
    notBetween: Op.notBetween, // NOT BETWEEN 11 AND 15
    in: Op.in, // IN [1, 2]
    notIn: Op.notIn, // NOT IN [1, 2]
    overlap: Op.overlap, // && [1, 2] (PG array overlap operator)
    // contains: Op.contains,          // @> [1, 2] (PG array contains operator)
    // contained: Op.contained,        // <@ [1, 2] (PG array contained by operator)
    // col: Op.col                     // = "user"."organization_id", with dialect specific column identifiers, PG in this example
    // any: Op.any                     // ANY ARRAY[2, 3]::INTEGER (PG only)
  }

  static complexOperators = {
    textContains: (value) => {
      const result = {
        [Op.iLike]: `%${value}%`,
      }
      return result
    },
  }

  constructor(options: IRepositoryOptions, aggregators = {}) {
    this.options = options
    this.aggregators = aggregators
    this.whereOrHaving = 'where'
  }

  /**
   * If an invalid UUID is passed to a query, it throws an exception.
   * To hack this behaviour, if the uuid is invalid, it creates a new one,
   * that won't match any of the database.
   * If the uuid is invalid, brings no results.
   */
  static uuid(value) {
    let id = value

    // If ID is invalid, sequelize throws an error.
    // For that not to happen, if the UUID is invalid, it sets
    // some random uuid
    if (!validator.isUUID(id)) {
      id = uuid()
    }

    return id
  }

  /**
   * Replaces operator (json object key) with Sequelize operator.
   * @param {JSON} json
   * @param {string} key
   * @param {Sequelize.op} op
   */
  static replaceKeyWithOperator(query, key, op) {
    const value = query[key]
    delete query[key]
    query[op] = value
    return query
  }

  static replaceKeyWithComplexOperator(query, key, complexOp) {
    const value = query[key]
    delete query[key]
    query = { ...query, ...complexOp(value) }
    return query
  }

  static parseOrderBy(orderBy) {
    if (typeof orderBy === 'string') {
      orderBy = orderBy.split(',').map((item) => item.trim())
    }
    return orderBy.map((item) => item.split('_'))
  }

  replaceKeyWithAggregator(query, key) {
    this.whereOrHaving = 'having'

    const value = query[key]
    delete query[key]
    const left = this.aggregators[key]
    const op = typeof value === 'object' ? QueryParser.operators[Object.keys(value)[0]] : Op.eq
    const right = typeof value === 'object' ? value[Object.keys(value)[0]] : value
    query[Op.and] = [Sequelize.where(left, op, right)]
    return query
  }

  /**
   * Iteratively replace json keys with Sequelize formated query operators.
   * @param {JSON} json next json
   */
  iterativeReplace(query) {
    Object.keys(query).forEach((key) => {
      if (this.aggregators[key]) {
        query = this.replaceKeyWithAggregator(query, key)
      } else if (key === 'id') {
        // When an ID is sent, we validate it.
        query[key] = QueryParser.uuid(query[key])
      } else if (query[key] !== null && typeof query[key] === 'object') {
        // When the value of the key is an object
        // Find if the key is an operation in the operations dict
        const op = QueryParser.operators[key]
        if (op) {
          // If we found an operation
          // Replace the key (operator string) with the Sequelize operator
          // Example: { "or": {...} } => { [Op.or]: {...} }
          query = QueryParser.replaceKeyWithOperator(query, key, op)

          // Recursively call the function with what is indisde the operator
          query[op] = this.iterativeReplace(query[op])
        } else {
          // If we didn't find an operation, then it is a nested object
          // Recursively call the function with the nested object
          query[key] = this.iterativeReplace(query[key])
        }
      } else if (key === 'model' && this.options.database[query[key]] != null) {
        // query['as'] = query[key].replace(/^./, char => char.toLowerCase());// /^\w/
        query.model = this.options.database[query[key]]
      } else {
        const op = QueryParser.operators[key]
        if (op) query = QueryParser.replaceKeyWithOperator(query, key, op)
        const complexOp = QueryParser.complexOperators[key]
        if (complexOp) query = QueryParser.replaceKeyWithComplexOperator(query, key, complexOp)
      }

      // console.debug("After Key:", key, " Query fields: ", JSON.stringify(query, null, 4))
    })
    return query
  }

  /**
   * Parse and build Sequelize format query
   * @param {JSON} query
   * @returns {JSON} sequelize formatted DB query params JSON
   */
  parseQueryFields(query) {
    const json = this.iterativeReplace(query)
    return json
  }

  /**
   * Parse and build Sequelize format query
   * @param {JSON} query
   * @returns {JSON} sequelize formatted DB include params JSON
   */
  parseIncludeFields(query) {
    const json = query
    this.iterativeReplace(json)
    return json
  }

  /**
   * Sequelize Query Parser is a very simple package that
   * turns your RESTful APIs into a basic set of Graph APIs.
   *
   * Parses - filter, query, sorting, paging, group, relational object queries
   *
   * fields=field01,field02...
   *
   * limit=value&&offset=value
   *
   * orderBy=field01.asc|field02.desc
   *
   * group_by=field01,field02
   *
   * query=JSON
   *
   * include=JSON
   *
   * filedName=unaryOperator:value
   *
   * @param {JSON} req
   * @returns {JSON} sequelize formatted DB query
   */
  parse(
    query: QueryInput = {
      filter: {},
      orderBy: undefined,
      limit: 0,
      offset: 0,
      include: false,
      fields: false,
    },
  ) {
    // eslint-disable-next-line prefer-const
    let { filter, orderBy, limit, offset, include, fields } = query
    console.debug('Request query: ', query)

    const dbQuery: any = {
      where: {
        tenantId: SequelizeRepository.getCurrentTenant(this.options).id,
      },
      limit: QueryParser.defaultPageSize,
      offset: 0,
    }

    if (fields) {
      if (typeof fields === 'string') {
        fields = fields.split(',')
      }
      // assign fields array to .attributes
      if (fields && fields.length > 0) dbQuery.attributes = fields
    }

    if (limit) {
      if (typeof limit === 'string') {
        limit = parseInt(limit, 10)
      }
      dbQuery.limit = Math.min(
        limit > 0 ? limit : QueryParser.defaultPageSize,
        QueryParser.maxPageSize,
      )
    }

    if (offset) {
      if (typeof offset === 'string') {
        offset = parseInt(offset, 10)
      }
      dbQuery.offset = offset
    }

    if (orderBy) {
      dbQuery.order = QueryParser.parseOrderBy(orderBy)
    }

    if (!lodash.isEmpty(filter)) {
      const parsed = this.parseQueryFields(filter)
      dbQuery[this.whereOrHaving] = { ...dbQuery[this.whereOrHaving], ...parsed }
    }

    if (include) {
      dbQuery.include = this.parseIncludeFields(query.include)
    }

    // // eslint-disable-next-line guard-for-in
    // for (const key in query) {
    //   switch (key) {
    //     // Fields
    //     case 'fields':
    //       // split the field names (attributes) and assign to an array
    //       // eslint-disable-next-line no-case-declarations
    //       const fields = query.fields.split(',')
    //       // assign fields array to .attributes
    //       if (fields && fields.length > 0) dbQuery.attributes = fields
    //       break

    //     // pagination page size
    //     case 'limit':
    //       dbQuery.limit = Math.min(Math.max(parseInt(query.limit, 10), 1), QueryParser.maxPageSize)
    //       // TODO: Uncomment if we end up going with page/perPage
    //       // limit = dbQuery.limit
    //       break

    //     // pagination page offset
    //     case 'offset':
    //       offset = Math.max(parseInt(query.offset, 10), 0)
    //       break

    //     // orderBy field order
    //     case 'orderBy':
    //       dbQuery.order = QueryParser.parseFields(query.orderBy)
    //       break

    //     // JSON (nested) query
    //     case 'query':
    //       // eslint-disable-next-line no-case-declarations
    //       const parsed = this.parseQueryFields(query.query)
    //       dbQuery[whereOrHaving] = { ...dbQuery.where, ...parsed }
    //       break

    //     // include and query on associated tables
    //     case 'include':
    //       dbQuery.include = this.parseIncludeFields(query.include)
    //       break

    //     // Simple filter query
    //     default:
    //       break
    //   }
    // }

    // dbQuery.offset = offset
    // dbQuery.limit = dbQuery.limit || QueryParser.maxPageSize

    // TODO: Switch if we end up going with page/perPage
    // dbQuery.offset = offset * limit

    return dbQuery
  }
}

export default QueryParser
