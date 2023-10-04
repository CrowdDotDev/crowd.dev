import { singleOrDefault, timeout } from '@crowd/common'
import { DATABASE_IOC, DbStore } from '@crowd/database'
import { INTEGRATION_SERVICES } from '@crowd/integrations'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { IntegrationRunWorkerEmitter, SQS_IOC } from '@crowd/sqs'
import { APP_IOC_MODULE } from 'ioc'
import IntegrationRunRepository from '../repo/integrationRun.repo'

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const emitter = ioc.get<IntegrationRunWorkerEmitter>(SQS_IOC.emitters.integrationRunWorker)

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

  const repo = new IntegrationRunRepository(store, log)

  const tenantIds = await repo.getTenantsWithIntegrations()

  for (const tenantId of tenantIds) {
    const integrations = await repo.getTenantIntegrations(tenantId)

    for (const integration of integrations) {
      if (singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integration.type)) {
        log.info(
          { integrationId: integration.id },
          'Integration found in new framework - triggering onboarding!',
        )
        await emitter.triggerIntegrationRun(
          integration.tenantId,
          integration.type,
          integration.id,
          true,
        )

        log.info('Sleeping for 5 minutes between starts of integration onboarding!')
        await timeout(5 * 60 * 1000)
      }
    }

    log.info('Sleeping for 15 minutes between starts of tenant onboarding!')
    await timeout(15 * 60 * 1000)
  }

  log.info('Done!')
  process.exit(0)
})
