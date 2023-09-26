import { ContainerModule } from 'inversify'
import { getServiceLogger } from './logger'

export const LOGGING_IOC = {
  logger: Symbol('logger'),
}

export const LOGGING_IOC_MODULE = (): ContainerModule => {
  return new ContainerModule((bind) => {
    const logger = getServiceLogger()
    bind(LOGGING_IOC.logger).toConstantValue(logger)
  })
}
