/**
 * This module creates the Sequelize to the database and
 * exports all the models.
 */
import Sequelize, { DataTypes } from 'sequelize'
import { getConfig } from '../../config'

const { highlight } = require('cli-highlight')

function models() {
  const database = {} as any

  const sequelize = new (<any>Sequelize)(
    getConfig().DATABASE_DATABASE,
    getConfig().DATABASE_USERNAME,
    getConfig().DATABASE_PASSWORD,
    {
      dialect: getConfig().DATABASE_DIALECT,
      port: getConfig().DATABASE_PORT ? getConfig().DATABASE_PORT : '5432',
      replication: {
        read: [{ host: getConfig().DATABASE_HOST_READ }],
        write: { host: getConfig().DATABASE_HOST_WRITE },
      },
      pool: {
        max: 200,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      logging:
        getConfig().DATABASE_LOGGING === 'true'
          ? (log) =>
              console.log(
                highlight(log, {
                  language: 'sql',
                  ignoreIllegals: true,
                }),
              )
          : false,
    },
  )

  const modelClasses = [
    require('./activity').default,
    require('./auditLog').default,
    require('./member').default,
    require('./file').default,
    require('./integration').default,
    require('./report').default,
    require('./settings').default,
    require('./tag').default,
    require('./tenant').default,
    require('./tenantUser').default,
    require('./user').default,
    require('./widget').default,
    require('./microservice').default,
    require('./conversation').default,
    require('./conversationSettings').default,
    require('./eagleEyeContent').default,
    require('./organization').default,
    require('./memberAttributeSettings').default
  ]

  for (const notInitmodel of modelClasses) {
    const model = notInitmodel(sequelize, DataTypes)
    database[model.name] = model
  }

  Object.keys(database).forEach((modelName) => {
    if (database[modelName].associate) {
      database[modelName].associate(database)
    }
  })

  database.sequelize = sequelize
  database.Sequelize = Sequelize

  return database
}

export default models
