import 'reflect-metadata'

import { DATABASE_IOC_MODULE } from '@crowd/database'
import { LOGGING_IOC, LOGGING_IOC_MODULE, Logger } from '@crowd/logging'
import { Emitters, SQS_IOC_MODULE } from '@crowd/sqs'
import { Container } from 'inversify'
import { DB_CONFIG, SQS_CONFIG } from './conf'

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
  IOC.load(await SQS_IOC_MODULE(IOC, SQS_CONFIG(), Emitters.INTEGRATION_STREAM_WORKER))
}
