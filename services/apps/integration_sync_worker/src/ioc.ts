import { DATABASE_IOC_MODULE } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, LOGGING_IOC_MODULE, Logger } from '@crowd/logging'
import { OPENSEARCH_IOC_MODULE } from '@crowd/opensearch'
import { SQS_IOC_MODULE } from '@crowd/sqs'
import { ContainerModule } from 'inversify'
import { DB_CONFIG, OPENSEARCH_CONFIG, SQS_CONFIG } from './conf'
import { APP_IOC } from './ioc_constants'
import { WorkerQueueReceiver } from './queue'
import { MemberSyncService } from './service/member.sync.service'
import { OpenSearchService } from './service/opensearch.service'
import { OrganizationSyncService } from './service/organization.sync.service'

export const APP_IOC_MODULE = async (maxConcurrentProcessing: number): Promise<void> => {
  const ioc = IOC()
  ioc.load(LOGGING_IOC_MODULE())
  const log = ioc.get<Logger>(LOGGING_IOC.logger)
  log.info('Loading IOC container...')

  ioc.load(await DATABASE_IOC_MODULE(ioc, DB_CONFIG(), maxConcurrentProcessing))
  ioc.load(await SQS_IOC_MODULE(ioc, SQS_CONFIG()))
  ioc.load(OPENSEARCH_IOC_MODULE(OPENSEARCH_CONFIG()))

  log.info('Preparing application modules...')
  const appModule = new ContainerModule((bind) => {
    bind(APP_IOC.maxConcurrentProcessing).toConstantValue(maxConcurrentProcessing)

    bind(APP_IOC.openseachService).to(OpenSearchService).inRequestScope()
    bind(APP_IOC.memberSyncService).to(MemberSyncService).inRequestScope()
    bind(APP_IOC.organizationSyncService).to(OrganizationSyncService).inRequestScope()

    bind(APP_IOC.queueWorker).to(WorkerQueueReceiver).inSingletonScope()
  })

  ioc.load(appModule)
}
