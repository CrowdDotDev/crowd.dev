import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import IntegrationRunRepository from '@/repo/integrationRun.repo'
import { singleOrDefault, timeout } from '@crowd/common'
import { DbStore, getDbConnection } from '@crowd/database'
import { INTEGRATION_SERVICES } from '@crowd/integrations'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationRunWorkerEmitter, getSqsClient } from '@crowd/sqs'

const log = getServiceLogger()

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationRunWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = getDbConnection(DB_CONFIG(), 1)
  const store = new DbStore(log, dbConnection)

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
