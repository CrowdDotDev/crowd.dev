import { DATABASE_IOC_MODULE } from '@crowd/database'
import { LOGGING_IOC, LOGGING_IOC_MODULE, Logger } from '@crowd/logging'
import { Emitters, SQS_IOC_MODULE } from '@crowd/sqs'
import { DB_CONFIG, SQS_CONFIG } from './conf'
import { IOC } from '@crowd/ioc'

export const APP_IOC_MODULE = async (maxConcurrentProcessing: number): Promise<void> => {
  const ioc = IOC()
  ioc.load(LOGGING_IOC_MODULE())
  const log = ioc.get<Logger>(LOGGING_IOC.logger)
  log.info('Loading IOC container...')

  ioc.load(await DATABASE_IOC_MODULE(ioc, DB_CONFIG(), maxConcurrentProcessing))
  ioc.load(await SQS_IOC_MODULE(ioc, SQS_CONFIG(), Emitters.INTEGRATION_STREAM_WORKER))
}
