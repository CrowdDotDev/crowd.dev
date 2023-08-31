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

  for (let i = 0; i < tenantIds.length; i++) {
    const tenantId = tenantIds[i]
    log.info({ tenantId }, `Processing tenant ${i + 1} of ${tenantIds.length}!`)

    const integrations = await repo.getTenantIntegrations(tenantId)
    let count = 0

    for (const integration of integrations) {
      if (singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integration.type)) {
        const isBeingProcessed = await repo.isIntegrationBeingOnboarded(integration.id)

        if (!isBeingProcessed) {
          log.info(
            { integrationId: integration.id },
            'Integration found in new framework - triggering onboarding!',
          )
          count++
          await emitter.triggerIntegrationRun(
            integration.tenantId,
            integration.type,
            integration.id,
            true,
          )

          // log.info('Sleeping for 1 minute between starts of integration onboarding!')
          // await timeout(60 * 1000)
        } else {
          log.info({ integrationId: integration.id }, 'Integration is already being onboarded!')
        }
      }
    }

    if (count > 0) {
      // const minutes = count * 3
      log.info(`Sleeping for a minute between starts of tenant onboarding!`)
      await timeout(60 * 1000)
    }
  }

  log.info('Done!')
  process.exit(0)
})
