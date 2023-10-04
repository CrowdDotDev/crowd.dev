import { DATABASE_IOC_MODULE } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, LOGGING_IOC_MODULE, Logger } from '@crowd/logging'
import { REDIS_IOC_MODULE } from '@crowd/redis'
import { Emitters, SQS_IOC_MODULE } from '@crowd/sqs'
import { Container, ContainerModule } from 'inversify'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from './conf'
import { APP_IOC } from './ioc_constants'
import { WorkerQueueReceiver } from './queue'
import IntegrationStreamService from './service/integrationStreamService'

export const APP_IOC_MODULE = async (maxConcurrentProcessing: number): Promise<Container> => {
  const ioc = IOC()
  ioc.load(LOGGING_IOC_MODULE())
  const log = ioc.get<Logger>(LOGGING_IOC.logger)
  log.info('Loading IOC container...')

  ioc.load(await DATABASE_IOC_MODULE(ioc, DB_CONFIG(), maxConcurrentProcessing))
  ioc.load(await REDIS_IOC_MODULE(ioc, REDIS_CONFIG()))
  ioc.load(
    await SQS_IOC_MODULE(
      ioc,
      SQS_CONFIG(),
      Emitters.INTEGRATION_RUN_WORKER |
        Emitters.INTEGRATION_DATA_WORKER |
        Emitters.INTEGRATION_STREAM_WORKER,
    ),
  )

  log.info('Preparing application modules...')
  const appModule = new ContainerModule((bind) => {
    bind(APP_IOC.maxConcurrentProcessing).toConstantValue(maxConcurrentProcessing)

    bind(APP_IOC.streamService).to(IntegrationStreamService).inRequestScope()
    bind(APP_IOC.queueWorker).to(WorkerQueueReceiver).inSingletonScope()
  })

  ioc.load(appModule)

  return ioc
}
