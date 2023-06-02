import validator from 'validator'
import { generateUUIDv4 as uuid } from '@crowd/common'
import Sequelize from 'sequelize'
import { Col } from 'sequelize/types/utils'

/**
 * Utilities to use on Sequelize queries.
 */
export default class SequelizeFilterUtils {
  /**
   * If you pass an invalid uuid to a query, it throws an exception.
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
   * Creates an ilike condition.
   */
  static ilikeIncludes(model, column, value) {
    return Sequelize.where(Sequelize.col(`${model}.${column}`), {
      [Sequelize.Op.iLike]: `%${value}%`.toLowerCase(),
    })
  }

  static ilikeIncludesCaseSensitive(model, column, value) {
    return Sequelize.where(Sequelize.col(`${model}.${column}`), {
      [Sequelize.Op.like]: `%${value}%`,
    })
  }

  static ilikeExact(model, column, value) {
    return Sequelize.where(Sequelize.col(`${model}.${column}`), {
      [Sequelize.Op.like]: (value || '').toLowerCase(),
    })
  }

  static jsonbILikeIncludes(model, column, value) {
    return Sequelize.where(Sequelize.literal(`CAST("${model}"."${column}" AS TEXT)`), {
      [Sequelize.Op.like]: `%${value}%`.toLowerCase(),
    })
  }

  static customOrderByIfExists(field, orderBy) {
    if (orderBy.includes(field)) {
      return [Sequelize.literal(`"${field}"`), orderBy.split('_')[1]]
    }

    return []
  }

  static getFieldLiteral(field: string, model: string): Col {
    return Sequelize.col(`"${model}"."${field}"`)
  }

  static getLiteralProjections(fields: any, model: string): string[] {
    return fields.reduce((acc, field) => {
      acc.push([SequelizeFilterUtils.getFieldLiteral(field, model), field])
      return acc
    }, [])
  }

  static getLiteralProjectionsOfModel(model: string, models: any, modelAlias: string = null) {
    return SequelizeFilterUtils.getLiteralProjections(
      Object.keys(models[model].rawAttributes),
      modelAlias ?? model,
    )
  }

  static getNativeTableFieldAggregations(fields, model) {
    return fields.reduce((acc, field) => {
      acc[field] = SequelizeFilterUtils.getFieldLiteral(field, model)
      return acc
    }, {})
  }
}
