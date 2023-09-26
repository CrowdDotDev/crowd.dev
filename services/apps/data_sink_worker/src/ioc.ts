import 'reflect-metadata'

import { DATABASE_IOC_MODULE } from '@crowd/database'
import { LOGGING_IOC, LOGGING_IOC_MODULE, Logger } from '@crowd/logging'
import { REDIS_IOC_MODULE } from '@crowd/redis'
import { Emitters, SQS_IOC_MODULE } from '@crowd/sqs'
import { Container, ContainerModule } from 'inversify'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from './conf'
import { APP_IOC } from './ioc_constants'
import { WorkerQueueReceiver } from './queue'
import DataSinkService from './service/dataSink.service'

export const IOC = new Container({
  skipBaseClassChecks: true,
  autoBindInjectable: true,
})

export const childIocContainer = (): Container => {
  const child = new Container()
  child.parent = IOC

  return child
}

export const APP_IOC_MODULE = async (maxConcurrentProcessing: number): Promise<void> => {
  IOC.load(LOGGING_IOC_MODULE())
  const log = IOC.get<Logger>(LOGGING_IOC.logger)
  log.info('Loading IOC container...')

  IOC.load(await DATABASE_IOC_MODULE(IOC, DB_CONFIG(), maxConcurrentProcessing))
  IOC.load(await REDIS_IOC_MODULE(IOC, REDIS_CONFIG()))
  IOC.load(
    await SQS_IOC_MODULE(IOC, SQS_CONFIG(), Emitters.NODEJS_WORKER | Emitters.SEARCH_SYNC_WORKER),
  )

  log.info('Preparing application modules...')
  const appModule = new ContainerModule((bind) => {
    bind(APP_IOC.maxConcurrentProcessing).toConstantValue(maxConcurrentProcessing)

    bind(APP_IOC.dataSinkService).to(DataSinkService).inRequestScope()
    bind(APP_IOC.queueWorker).to(WorkerQueueReceiver).inSingletonScope()
  })

  IOC.load(appModule)
}
