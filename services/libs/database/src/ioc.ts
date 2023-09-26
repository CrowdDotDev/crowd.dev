import { LOGGING_IOC, Logger } from '@crowd/logging'
import { Container, ContainerModule } from 'inversify'
import { getDbConnection, getDbInstance } from './connection'
import { DbStore } from './dbStore'
import { IDatabaseConfig } from './types'

export const DATABASE_IOC = {
  config: Symbol('dbConfig'),
  maxPoolSize: Symbol('dbMaxPoolSize'),
  instance: Symbol('dbInstance'),
  connection: Symbol('dbConnection'),
  store: Symbol('dbStore'),
}

export const DATABASE_IOC_MODULE = async (
  ioc: Container,
  config: IDatabaseConfig,
  maxPoolSize?: number,
): Promise<ContainerModule> => {
  const instance = getDbInstance()
  const connection = await getDbConnection(config, maxPoolSize)
  const logger = ioc.get<Logger>(LOGGING_IOC.logger)
  const store = new DbStore(logger, connection)

  return new ContainerModule((bind) => {
    bind(DATABASE_IOC.config).toConstantValue(config)
    if (maxPoolSize) {
      bind(DATABASE_IOC.maxPoolSize).toConstantValue(maxPoolSize)
    }
    bind(DATABASE_IOC.instance).toConstantValue(instance)
    bind(DATABASE_IOC.connection).toConstantValue(connection)
    bind(DATABASE_IOC.store).toConstantValue(store)
  })
}
