import CronTime from 'cron-time-generator'

import { READ_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { Logger } from '@crowd/logging'

import { IntegrationRunWorkerEmitter } from '../../../../libs/common_services/src/services/emitters/integrationRunWorker.emitter'
import { QUEUE_CONFIG, QueueFactory } from '../../../../libs/queue/src/factory'
import { IJobDefinition } from '../types'
import { PlatformType } from '@crowd/types'

const maxIntegrationResults = 10000000
const maxIntegrationsToOnboard = 10
const platformsByPriority = new Set([
  PlatformType.GROUPSIO,
  PlatformType.LINKEDIN,
  PlatformType.JIRA,
  PlatformType.HACKERNEWS,
  PlatformType.REDDIT,
  PlatformType.STACKOVERFLOW,
  PlatformType.TWITTER,
  PlatformType.SLACK,
])
const fixDate = new Date('2025-06-06').toISOString() //any integration connected after this date shouldn't be re-onboarded

/* eslint-disable @typescript-eslint/no-explicit-any */
async function getPrioritizedIntegrations(query: QueryExecutor, log: Logger): Promise<any | null> {
  for (const platform of platformsByPriority) {
    const result = await query.select(
      `
      SELECT DISTINCT it.id, it.platform
      FROM integrations it
      INNER JOIN (
        SELECT "integrationId", MAX("createdAt") as last_onboarding
        FROM "integration"."runs"
        WHERE onboarding = true
        GROUP BY "integrationId"
      ) latest_onboarding_run ON it.id = latest_onboarding_run."integrationId"
      WHERE it.platform = $(platform)
      AND it."deletedAt" is NULL
      AND it.status = 'done'
      AND latest_onboarding_run.last_onboarding < $(fixDate)
      LIMIT $(maxIntegrationsToOnboard)
      `,
      { platform, fixDate, maxIntegrationsToOnboard },
    )

    if (result && result.length > 0) {
      log.info(
        {
          count: result.length,
          platform,
        },
        'Found integrations to re-onboard',
      )
      return result
    }
    log.info(
      {
        count: result.length,
        platform,
      },
      'No integration found for re-onboarding, skipping platform',
    )
  }
  log.info({ platformsByPriority }, 'No integration found to re-onboard for defined platforms')
  return null
}

const job: IJobDefinition = {
  name: 're-onboard-integrations',
  cronTime: CronTime.every(24).hours(),
  timeout: 15 * 60,
  process: async (ctx) => {
    ctx.log.info('Starting re-onboarding integrations job')

    const dbConnection = await getDbConnection(READ_DB_CONFIG())
    const query = pgpQx(dbConnection)

    const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
    const emitter = new IntegrationRunWorkerEmitter(queueClient, ctx.log)
    await emitter.init()

    // check system load
    const integrationResultsNumber = await query.selectOne(
      `
        SELECT COUNT(*)
        FROM "integration"."results"
      `,
    )
    if (integrationResultsNumber.count >= maxIntegrationResults) {
      ctx.log.warn(
        `Aborting re-onboarding due to high load, integration.results having ${integrationResultsNumber.count}`,
      )
      return
    }

    const integrationsToOnboard = await getPrioritizedIntegrations(query, ctx.log)
    if (!integrationsToOnboard) {
      ctx.log.info('No integration to be re-onboarded. cronJob should be disabled')
      return
    }

    // Trigger re-onboarding for integrations
    for (const integration of integrationsToOnboard) {
      try {
        ctx.log.info(
          {
            integrationId: integration.id,
            platform: integration.platform,
          },
          'Triggering re-onboarding for integrations',
        )

        await emitter.triggerIntegrationRun(integration.platform, integration.id, true)
      } catch (err) {
        ctx.log.error(
          {
            err,
            integrationId: integration.id,
            platform: integration.platform,
          },
          'Error triggering re-onboarding for integration',
        )
      }
    }

    ctx.log.info('Finished re-onboarding integrations job')
  },
}

export default job
