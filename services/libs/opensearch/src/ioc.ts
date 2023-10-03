import { IOpenSearchConfig } from '@crowd/types'
import { getOpensearchClient } from './client'
import { OPENSEARCH_IOC } from './ioc_constants'
import { ContainerModule } from 'inversify'
import { ActivitySyncService } from './service/activity.sync.service'
import { InitService } from './service/init.service'
import { MemberSyncService } from './service/member.sync.service'
import { OpenSearchService } from './service/opensearch.service'
import { OrganizationSyncService } from './service/organization.sync.service'

export const OPENSEARCH_IOC_MODULE = (config: IOpenSearchConfig): ContainerModule => {
  return new ContainerModule((bind) => {
    bind(OPENSEARCH_IOC.config).toConstantValue(config)
    bind(OPENSEARCH_IOC.client).toConstantValue(getOpensearchClient(config))

    bind(OPENSEARCH_IOC.initService).to(InitService).inRequestScope()
    bind(OPENSEARCH_IOC.openseachService).to(OpenSearchService).inRequestScope()
    bind(OPENSEARCH_IOC.activitySyncService).to(ActivitySyncService).inRequestScope()
    bind(OPENSEARCH_IOC.memberSyncService).to(MemberSyncService).inRequestScope()
    bind(OPENSEARCH_IOC.organizationSyncService).to(OrganizationSyncService).inRequestScope()
  })
}
