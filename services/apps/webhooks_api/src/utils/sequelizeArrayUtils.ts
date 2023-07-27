import Sequelize, { DataTypes } from 'sequelize'
import { DB_CONFIG } from '../conf'

export default class SequelizeArrayUtils {
  // MySQL doesn't have Array Field
  static get DataType() {
    return DB_CONFIG.dialect === 'mysql' ? DataTypes.JSON : DataTypes.ARRAY(DataTypes.TEXT)
  }

  static filter(tableName, fieldName, filterValue) {
    const filterValueAsArray = Array.isArray(filterValue) ? filterValue : [filterValue]

    if (DB_CONFIG.dialect === 'mysql') {
      return {
        [Symbol('and')]: filterValueAsArray.map((filterValue) =>
          arrayContainsForMySQL(tableName, fieldName, filterValue),
        ),
      }
    }
    return {
      [fieldName]: {
        [Symbol('contains')]: filterValueAsArray,
      },
    }
  }
}

function arrayContainsForMySQL(model, column, value) {
  return Sequelize.fn('JSON_CONTAINS', Sequelize.col(`${model}.${column}`), `"${value}"`)
}
