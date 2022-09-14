/**
 * This module creates the Sequelize to the database and
 * exports all the models.
 */
import Sequelize, { DataTypes } from 'sequelize'
import { DB_CONFIG } from '../../config'

const { highlight } = require('cli-highlight')

function models() {
  const database = {} as any

  const sequelize = new (<any>Sequelize)(
    DB_CONFIG.database,
    DB_CONFIG.username,
    DB_CONFIG.password,
    {
      dialect: DB_CONFIG.dialect,
      port: DB_CONFIG.port,
      replication: {
        read: [{ host: DB_CONFIG.readHost }],
        write: { host: DB_CONFIG.writeHost },
      },
      pool: {
        max: 200,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      logging: DB_CONFIG.logging
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
    require('./communityMember').default,
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
