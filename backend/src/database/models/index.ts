import Sequelize, { DataTypes } from 'sequelize'
/**
 * This module creates the Sequelize to the database and
 * exports all the models.
 */
import { getServiceChildLogger } from '@crowd/logging'
import { DB_CONFIG, SERVICE } from '../../conf'
import * as configTypes from '../../conf/configTypes'

const { highlight } = require('cli-highlight')

const log = getServiceChildLogger('Database')

interface Credentials {
  username: string
  password: string
}

function getCredentials(): Credentials {
  if (DB_CONFIG.username) {
    return {
      username: DB_CONFIG.username,
      password: DB_CONFIG.password,
    }
  }

  switch (SERVICE) {
    case configTypes.ServiceType.API:
      return {
        username: DB_CONFIG.apiUsername,
        password: DB_CONFIG.apiPassword,
      }
    case configTypes.ServiceType.JOB_GENERATOR:
      return {
        username: DB_CONFIG.jobGeneratorUsername,
        password: DB_CONFIG.jobGeneratorPassword,
      }
    case configTypes.ServiceType.NODEJS_WORKER:
      return {
        username: DB_CONFIG.nodejsWorkerUsername,
        password: DB_CONFIG.nodejsWorkerPassword,
      }
    default:
      throw new Error('Incorrectly configured database connection settings!')
  }
}

function models() {
  const database = {} as any

  const credentials = getCredentials()

  const sequelize = new (<any>Sequelize)(
    DB_CONFIG.database,
    credentials.username,
    credentials.password,
    {
      dialect: DB_CONFIG.dialect,
      dialectOptions: {
        application_name: SERVICE,
        connectionTimeoutMillis: 5000,
        query_timeout: 30000,
        idle_in_transaction_session_timeout: 10000,
      },
      port: DB_CONFIG.port,
      replication: {
        read: [
          {
            host:
              SERVICE === configTypes.ServiceType.API ? DB_CONFIG.readHost : DB_CONFIG.writeHost,
          },
        ],
        write: { host: DB_CONFIG.writeHost },
      },
      pool: {
        max: SERVICE === configTypes.ServiceType.API ? 20 : 10,
        min: 0,
        acquire: 50000,
        idle: 10000,
      },
      logging: DB_CONFIG.logging
        ? (dbLog) =>
            log.info(
              highlight(dbLog, {
                language: 'sql',
                ignoreIllegals: true,
              }),
              'DB LOG',
            )
        : false,
    },
  )

  const modelClasses = [
    require('./activity').default,
    require('./auditLog').default,
    require('./member').default,
    require('./memberIdentity').default,
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
    require('./eagleEyeAction').default,
    require('./automation').default,
    require('./automationExecution').default,
    require('./organization').default,
    require('./organizationCache').default,
    require('./memberAttributeSettings').default,
    require('./task').default,
    require('./note').default,
    require('./memberActivityAggregatesMV').default,
    require('./segment').default,
    require('./customView').default,
    require('./customViewOrder').default,
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
