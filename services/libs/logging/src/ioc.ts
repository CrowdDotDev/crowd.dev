import { ContainerModule, IOC_TYPES, containerModule } from '@crowd/ioc'

import { getServiceLogger } from './logger'

export const LOGGING_IOC_MODULE = (): ContainerModule =>
  containerModule((bind) => {
    const serviceLogger = getServiceLogger()
    bind(IOC_TYPES.LOGGER).toConstantValue(serviceLogger)
  })
