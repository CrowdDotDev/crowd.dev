import 'reflect-metadata'

import { Container, ContainerModule } from 'inversify'
import { LOGGING_IOC, LOGGING_IOC_MODULE, Logger } from '@crowd/logging'
import { DATABASE_IOC_MODULE } from '@crowd/database'
import { OPENSEARCH_IOC_MODULE } from '@crowd/opensearch'
import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG, SQS_CONFIG } from './conf'
import { SQS_IOC_MODULE } from '@crowd/sqs'
import { APP_IOC } from './ioc_constants'
import { REDIS_IOC_MODULE } from '@crowd/redis'
import { OpenSearchService } from './service/opensearch.service'
import { ActivitySyncService } from './service/activity.sync.service'
import { MemberSyncService } from './service/member.sync.service'
import { OrganizationSyncService } from './service/organization.sync.service'
import { WorkerQueueReceiver } from './queue'
import { InitService } from './service/init.service'

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
  IOC.load(await SQS_IOC_MODULE(IOC, SQS_CONFIG()))
  IOC.load(await REDIS_IOC_MODULE(IOC, REDIS_CONFIG()))
  IOC.load(OPENSEARCH_IOC_MODULE(OPENSEARCH_CONFIG()))

  log.info('Preparing application modules...')
  const appModule = new ContainerModule((bind) => {
    bind(APP_IOC.maxConcurrentProcessing).toConstantValue(maxConcurrentProcessing)

    bind(APP_IOC.initService).to(InitService).inRequestScope()
    bind(APP_IOC.openseachService).to(OpenSearchService).inRequestScope()
    bind(APP_IOC.activitySyncService).to(ActivitySyncService).inRequestScope()
    bind(APP_IOC.memberSyncService).to(MemberSyncService).inRequestScope()
    bind(APP_IOC.organizationSyncService).to(OrganizationSyncService).inRequestScope()

    bind(APP_IOC.queueWorker).to(WorkerQueueReceiver).inSingletonScope()
  })

  IOC.load(appModule)
}
