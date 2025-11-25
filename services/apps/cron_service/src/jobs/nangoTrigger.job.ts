import CronTime from 'cron-time-generator'

import { ConcurrencyLimiter, IS_DEV_ENV } from '@crowd/common'
import { READ_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { fetchNangoIntegrationDataForCheck } from '@crowd/data-access-layer/src/integrations'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import {
  ALL_NANGO_INTEGRATIONS,
  INangoWebhookPayload,
  NANGO_INTEGRATION_CONFIG,
  NangoIntegration,
  nangoIntegrationToPlatform,
  platformToNangoIntegration,
} from '@crowd/nango'
import { TEMPORAL_CONFIG, WorkflowIdReusePolicy, getTemporalClient } from '@crowd/temporal'
import { PlatformType } from '@crowd/types'

import { IJobDefinition } from '../types'

const job: IJobDefinition = {
  name: 'nango-trigger',
  cronTime: IS_DEV_ENV ? CronTime.everyMinute() : CronTime.everyHour(),
  timeout: 4 * 60 * 60, // 4 hours
  process: async (ctx) => {
    ctx.log.info('Triggering nango API check as if a webhook was received!')

    const temporal = await getTemporalClient(TEMPORAL_CONFIG())

    const dbConnection = await getDbConnection(READ_DB_CONFIG(), 3, 0)

    const integrationsToTrigger = await fetchNangoIntegrationDataForCheck(pgpQx(dbConnection), [
      ...new Set(ALL_NANGO_INTEGRATIONS.map(nangoIntegrationToPlatform)),
    ])

    const limiter = new ConcurrencyLimiter(5)

    // Collect all workflow start operations
    const workflowStarts: Array<() => Promise<void>> = []

    for (let i = 0; i < integrationsToTrigger.length; i++) {
      const int = integrationsToTrigger[i]

      const { id, settings } = int

      ctx.log.info(
        `${i + 1}/${integrationsToTrigger.length} Triggering nango integration check for ${id} (${int.platform})`,
      )

      const platform = platformToNangoIntegration(int.platform as PlatformType, settings)

      if (platform === NangoIntegration.GITHUB && !settings.nangoMapping) {
        // ignore non-nango github integrations
        continue
      }

      for (const model of Object.values(NANGO_INTEGRATION_CONFIG[platform].models)) {
        ctx.log.debug(
          {
            integrationId: id,
            platform,
            model,
          },
          'Triggering nango integration check!',
        )

        if (platform === NangoIntegration.GITHUB) {
          // trigger for each connection id - could be multiple because 1 integration can have multiple repositories and each repository has a connection id on nango
          for (const connectionId of Object.keys(settings.nangoMapping)) {
            const payload: INangoWebhookPayload = {
              connectionId: connectionId,
              providerConfigKey: platform,
              syncName: 'not important',
              model,
              responseResults: { added: 1, updated: 1, deleted: 1 },
              syncType: 'INCREMENTAL',
              modifiedAfter: new Date().toISOString(),
            }

            workflowStarts.push(async () => {
              try {
                await temporal.workflow.start('processNangoWebhook', {
                  taskQueue: 'nango',
                  workflowId: `nango-webhook/${platform}/${id}/${connectionId}/${model}/cron-triggered`,
                  workflowIdReusePolicy:
                    WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
                  retry: {
                    maximumAttempts: 10,
                  },
                  args: [payload],
                })
              } catch (error) {
                if (error.name === 'WorkflowExecutionAlreadyStartedError') {
                  ctx.log.debug(
                    {
                      integrationId: id,
                      platform,
                      model,
                      connectionId,
                    },
                    'Workflow already running, skipping...',
                  )
                  return
                }
                throw error
              }
            })
          }
        } else {
          const payload: INangoWebhookPayload = {
            connectionId: id,
            providerConfigKey: platform,
            syncName: 'not important',
            model,
            responseResults: { added: 1, updated: 1, deleted: 1 },
            syncType: 'INCREMENTAL',
            modifiedAfter: new Date().toISOString(),
          }

          workflowStarts.push(async () => {
            try {
              await temporal.workflow.start('processNangoWebhook', {
                taskQueue: 'nango',
                workflowId: `nango-webhook/${platform}/${id}/${model}/cron-triggered`,
                workflowIdReusePolicy:
                  WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
                retry: {
                  maximumAttempts: 10,
                },
                args: [payload],
              })
            } catch (error) {
              if (error.name === 'WorkflowExecutionAlreadyStartedError') {
                ctx.log.debug(
                  {
                    integrationId: id,
                    platform,
                    model,
                  },
                  'Workflow already running, skipping...',
                )
                return
              }
              throw error
            }
          })
        }
      }
    }

    ctx.log.info(`Triggering nango integration checks with ${workflowStarts.length} workflows!`)

    // Process all workflow starts with concurrency limit
    for (const workflowStart of workflowStarts) {
      await limiter.execute(workflowStart)
    }

    // Wait for all remaining jobs to complete
    await limiter.waitForFinish()
  },
}

export default job
